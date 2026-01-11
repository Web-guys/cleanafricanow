<?php
/**
 * CleanAfricaNow Users API
 * User and profile management (admin)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

class UsersAPI {
    
    /**
     * Get all users (admin only)
     */
    public static function getAll(array $filters = []): array {
        Auth::requireRole('admin');
        
        $db = getDB();
        
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['role'])) {
            $where[] = "EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = :role)";
            $params['role'] = $filters['role'];
        }
        
        if (!empty($filters['city_id'])) {
            $where[] = "p.city_id = :city_id";
            $params['city_id'] = $filters['city_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(p.full_name LIKE :search OR u.email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (isset($filters['is_active'])) {
            $where[] = "p.is_active = :is_active";
            $params['is_active'] = $filters['is_active'] ? 1 : 0;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Pagination
        $page = max(1, intval($filters['page'] ?? 1));
        $limit = min(100, max(1, intval($filters['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $db->prepare("
            SELECT COUNT(DISTINCT u.id) 
            FROM users u 
            LEFT JOIN profiles p ON p.id = u.id 
            WHERE $whereClause
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // Get users
        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.email,
                u.created_at,
                u.last_sign_in_at,
                u.is_active as user_active,
                p.full_name,
                p.phone,
                p.avatar_url,
                p.city_id,
                p.impact_score,
                p.reports_count,
                p.is_active,
                c.name as city_name
            FROM users u
            LEFT JOIN profiles p ON p.id = u.id
            LEFT JOIN cities c ON c.id = p.city_id
            WHERE $whereClause
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->execute();
        
        $users = $stmt->fetchAll();
        
        // Get roles for each user
        foreach ($users as &$user) {
            $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $user['id']]);
            $user['roles'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        return [
            'data' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => intval($total),
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    /**
     * Get user by ID
     */
    public static function getById(string $id): ?array {
        $currentUser = Auth::requireAuth();
        
        // Users can view themselves, admins can view anyone
        if ($currentUser['id'] !== $id && !in_array('admin', $currentUser['roles'])) {
            errorResponse('Forbidden', 403);
        }
        
        return Auth::getUserById($id);
    }
    
    /**
     * Update user profile
     */
    public static function update(string $id, array $data): array {
        $currentUser = Auth::requireAuth();
        
        // Users can update themselves, admins can update anyone
        if ($currentUser['id'] !== $id && !in_array('admin', $currentUser['roles'])) {
            errorResponse('Forbidden', 403);
        }
        
        $db = getDB();
        
        $updates = [];
        $params = ['id' => $id];
        
        $allowedFields = ['full_name', 'phone', 'avatar_url', 'bio', 'city_id', 'preferred_language'];
        
        // Admins can also update is_active
        if (in_array('admin', $currentUser['roles'])) {
            $allowedFields[] = 'is_active';
        }
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = in_array($field, ['full_name', 'bio']) 
                    ? sanitize($data[$field]) 
                    : $data[$field];
            }
        }
        
        if (empty($updates)) {
            return Auth::getUserById($id);
        }
        
        $updateClause = implode(', ', $updates);
        $stmt = $db->prepare("UPDATE profiles SET $updateClause, updated_at = NOW() WHERE id = :id");
        $stmt->execute($params);
        
        logActivity($currentUser['id'], 'profile_updated', 'profile', $id);
        
        return Auth::getUserById($id);
    }
    
    /**
     * Update user roles (admin only)
     */
    public static function updateRoles(string $id, array $roles): array {
        Auth::requireRole('admin');
        
        $db = getDB();
        
        // Validate roles
        $validRoles = ['admin', 'municipality', 'citizen', 'tourist', 'ngo', 'volunteer', 'partner'];
        foreach ($roles as $role) {
            if (!in_array($role, $validRoles)) {
                errorResponse("Invalid role: $role", 400);
            }
        }
        
        $db->beginTransaction();
        
        try {
            // Remove existing roles
            $stmt = $db->prepare("DELETE FROM user_roles WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $id]);
            
            // Add new roles
            foreach ($roles as $role) {
                $stmt = $db->prepare("
                    INSERT INTO user_roles (id, user_id, role) 
                    VALUES (:id, :user_id, :role)
                ");
                $stmt->execute([
                    'id' => generateUUID(),
                    'user_id' => $id,
                    'role' => $role
                ]);
            }
            
            $db->commit();
            
            logActivity(Auth::getCurrentUser()['id'], 'roles_updated', 'user', $id, ['roles' => $roles]);
            
            return Auth::getUserById($id);
            
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('Failed to update roles', 500);
        }
    }
    
    /**
     * Delete user (admin only)
     */
    public static function delete(string $id): array {
        $admin = Auth::requireRole('admin');
        
        if ($admin['id'] === $id) {
            errorResponse('Cannot delete yourself', 400);
        }
        
        $db = getDB();
        
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('User not found', 404);
        }
        
        logActivity($admin['id'], 'user_deleted', 'user', $id);
        
        return ['success' => true, 'message' => 'User deleted'];
    }
    
    /**
     * Get public profile (limited info)
     */
    public static function getPublicProfile(string $id): ?array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                id,
                full_name,
                avatar_url,
                city_id,
                impact_score,
                reports_count,
                created_at
            FROM profiles
            WHERE id = :id AND is_active = TRUE
        ");
        $stmt->execute(['id' => $id]);
        
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Get leaderboard
     */
    public static function getLeaderboard(int $limit = 50): array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                p.id,
                p.full_name,
                p.avatar_url,
                p.impact_score,
                p.reports_count,
                c.name as city_name
            FROM profiles p
            LEFT JOIN cities c ON c.id = p.city_id
            WHERE p.is_active = TRUE AND p.reports_count > 0
            ORDER BY p.impact_score DESC, p.reports_count DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}

// Router
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'leaderboard') {
            jsonResponse(UsersAPI::getLeaderboard(intval($_GET['limit'] ?? 50)));
        } elseif ($action === 'public' && $id) {
            $profile = UsersAPI::getPublicProfile($id);
            if ($profile) {
                jsonResponse($profile);
            } else {
                errorResponse('Profile not found', 404);
            }
        } elseif ($id) {
            $user = UsersAPI::getById($id);
            if ($user) {
                jsonResponse($user);
            } else {
                errorResponse('User not found', 404);
            }
        } else {
            jsonResponse(UsersAPI::getAll($_GET));
        }
        break;
        
    case 'PUT':
    case 'PATCH':
        if (!$id) {
            errorResponse('User ID required', 400);
        }
        $data = getRequestBody();
        if ($action === 'roles') {
            jsonResponse(UsersAPI::updateRoles($id, $data['roles'] ?? []));
        } else {
            jsonResponse(UsersAPI::update($id, $data));
        }
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('User ID required', 400);
        }
        jsonResponse(UsersAPI::delete($id));
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}
