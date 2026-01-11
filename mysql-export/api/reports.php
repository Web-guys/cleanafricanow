<?php
/**
 * CleanAfricaNow Reports API
 * CRUD operations for environmental reports
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

class ReportsAPI {
    
    /**
     * Get all reports (public)
     */
    public static function getAll(array $filters = []): array {
        $db = getDB();
        
        $where = ["is_deleted = FALSE"];
        $params = [];
        
        // Category filter
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $where[] = "category = :category";
            $params['category'] = $filters['category'];
        }
        
        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        
        // City filter
        if (!empty($filters['city_id'])) {
            $where[] = "city_id = :city_id";
            $params['city_id'] = $filters['city_id'];
        }
        
        // Priority filter
        if (!empty($filters['priority'])) {
            $where[] = "priority = :priority";
            $params['priority'] = $filters['priority'];
        }
        
        // Date range filter
        if (!empty($filters['from_date'])) {
            $where[] = "created_at >= :from_date";
            $params['from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $where[] = "created_at <= :to_date";
            $params['to_date'] = $filters['to_date'];
        }
        
        // Bounding box for map
        if (isset($filters['min_lat'], $filters['max_lat'], $filters['min_lng'], $filters['max_lng'])) {
            $where[] = "latitude BETWEEN :min_lat AND :max_lat";
            $where[] = "longitude BETWEEN :min_lng AND :max_lng";
            $params['min_lat'] = $filters['min_lat'];
            $params['max_lat'] = $filters['max_lat'];
            $params['min_lng'] = $filters['min_lng'];
            $params['max_lng'] = $filters['max_lng'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Pagination
        $page = max(1, intval($filters['page'] ?? 1));
        $limit = min(100, max(1, intval($filters['limit'] ?? 100)));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) FROM reports WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // Get reports
        $stmt = $db->prepare("
            SELECT 
                id,
                category,
                description,
                ROUND(latitude, 3) as latitude,
                ROUND(longitude, 3) as longitude,
                city_id,
                status,
                priority,
                photos,
                sla_due_date,
                verified_at,
                resolved_at,
                created_at,
                updated_at
            FROM reports
            WHERE $whereClause
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->execute();
        
        $reports = $stmt->fetchAll();
        
        // Parse JSON photos
        foreach ($reports as &$report) {
            $report['photos'] = json_decode($report['photos'] ?? '[]', true);
        }
        
        return [
            'data' => $reports,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => intval($total),
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    /**
     * Get single report by ID
     */
    public static function getById(string $id): ?array {
        $db = getDB();
        $user = Auth::getCurrentUser();
        
        // Check if user has elevated access
        $hasFullAccess = $user && (
            in_array('admin', $user['roles']) ||
            in_array('municipality', $user['roles']) ||
            in_array('ngo', $user['roles'])
        );
        
        if ($hasFullAccess) {
            $stmt = $db->prepare("
                SELECT 
                    r.*,
                    p.full_name as submitter_name,
                    c.name as city_name
                FROM reports r
                LEFT JOIN profiles p ON p.id = r.user_id
                LEFT JOIN cities c ON c.id = r.city_id
                WHERE r.id = :id AND r.is_deleted = FALSE
            ");
        } else {
            $stmt = $db->prepare("
                SELECT 
                    id,
                    category,
                    description,
                    ROUND(latitude, 3) as latitude,
                    ROUND(longitude, 3) as longitude,
                    city_id,
                    status,
                    priority,
                    photos,
                    sla_due_date,
                    verified_at,
                    resolved_at,
                    created_at,
                    updated_at
                FROM reports
                WHERE id = :id AND is_deleted = FALSE
            ");
        }
        
        $stmt->execute(['id' => $id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            return null;
        }
        
        $report['photos'] = json_decode($report['photos'] ?? '[]', true);
        
        return $report;
    }
    
    /**
     * Create new report
     */
    public static function create(array $data): array {
        $user = Auth::requireAuth();
        
        $required = ['category', 'description', 'latitude', 'longitude'];
        $missing = validateRequired($data, $required);
        if (!empty($missing)) {
            errorResponse('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        // Validate category
        $validCategories = ['waste', 'pollution', 'danger', 'noise', 'water', 'air', 
            'illegal_dumping', 'deforestation', 'water_pollution', 'sewage',
            'chemical_waste', 'medical_waste', 'electronic_waste', 
            'construction_debris', 'agricultural_waste', 'oil_spill', 
            'wildlife_harm', 'other'];
        
        if (!in_array($data['category'], $validCategories)) {
            errorResponse('Invalid category', 400);
        }
        
        // Validate coordinates
        $lat = floatval($data['latitude']);
        $lng = floatval($data['longitude']);
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            errorResponse('Invalid coordinates', 400);
        }
        
        $db = getDB();
        $reportId = generateUUID();
        $priority = $data['priority'] ?? 'medium';
        
        // Find city based on coordinates (simplified - closest city)
        $cityId = null;
        if (!empty($data['city_id'])) {
            $cityId = $data['city_id'];
        }
        
        $stmt = $db->prepare("
            INSERT INTO reports (
                id, user_id, category, description, latitude, longitude, 
                city_id, priority, photos, status
            ) VALUES (
                :id, :user_id, :category, :description, :latitude, :longitude,
                :city_id, :priority, :photos, 'pending'
            )
        ");
        
        $stmt->execute([
            'id' => $reportId,
            'user_id' => $user['id'],
            'category' => $data['category'],
            'description' => sanitize($data['description']),
            'latitude' => $lat,
            'longitude' => $lng,
            'city_id' => $cityId,
            'priority' => $priority,
            'photos' => json_encode($data['photos'] ?? [])
        ]);
        
        logActivity($user['id'], 'report_created', 'report', $reportId);
        
        return self::getById($reportId);
    }
    
    /**
     * Update report
     */
    public static function update(string $id, array $data): array {
        $user = Auth::requireAuth();
        $db = getDB();
        
        // Get existing report
        $stmt = $db->prepare("SELECT * FROM reports WHERE id = :id AND is_deleted = FALSE");
        $stmt->execute(['id' => $id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            errorResponse('Report not found', 404);
        }
        
        // Check permissions
        $isOwner = $report['user_id'] === $user['id'];
        $isAdmin = in_array('admin', $user['roles']);
        $isMunicipality = in_array('municipality', $user['roles']);
        $isNgo = in_array('ngo', $user['roles']);
        
        if (!$isOwner && !$isAdmin && !$isMunicipality && !$isNgo) {
            errorResponse('Forbidden', 403);
        }
        
        // Build update query
        $updates = [];
        $params = ['id' => $id];
        
        $allowedFields = ['description', 'category', 'priority'];
        if ($isAdmin || $isMunicipality || $isNgo) {
            $allowedFields = array_merge($allowedFields, ['status', 'verified_at', 'resolved_at']);
        }
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = $field === 'description' ? sanitize($data[$field]) : $data[$field];
            }
        }
        
        // Handle status change side effects
        if (isset($data['status'])) {
            if ($data['status'] === 'verified' && $report['status'] !== 'verified') {
                $updates[] = "verified_at = NOW()";
                $updates[] = "verified_by = :verified_by";
                $params['verified_by'] = $user['id'];
            }
            if ($data['status'] === 'resolved' && $report['status'] !== 'resolved') {
                $updates[] = "resolved_at = NOW()";
                $updates[] = "resolved_by = :resolved_by";
                $params['resolved_by'] = $user['id'];
            }
        }
        
        if (empty($updates)) {
            return self::getById($id);
        }
        
        $updateClause = implode(', ', $updates);
        $stmt = $db->prepare("UPDATE reports SET $updateClause, updated_at = NOW() WHERE id = :id");
        $stmt->execute($params);
        
        logActivity($user['id'], 'report_updated', 'report', $id, ['changes' => array_keys($data)]);
        
        return self::getById($id);
    }
    
    /**
     * Delete report (soft delete)
     */
    public static function delete(string $id): array {
        $user = Auth::requireAuth();
        $db = getDB();
        
        // Get existing report
        $stmt = $db->prepare("SELECT user_id FROM reports WHERE id = :id AND is_deleted = FALSE");
        $stmt->execute(['id' => $id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            errorResponse('Report not found', 404);
        }
        
        // Check permissions
        $isOwner = $report['user_id'] === $user['id'];
        $isAdmin = in_array('admin', $user['roles']);
        
        if (!$isOwner && !$isAdmin) {
            errorResponse('Forbidden', 403);
        }
        
        $stmt = $db->prepare("UPDATE reports SET is_deleted = TRUE, deleted_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        logActivity($user['id'], 'report_deleted', 'report', $id);
        
        return ['success' => true, 'message' => 'Report deleted'];
    }
    
    /**
     * Get report statistics
     */
    public static function getStats(array $filters = []): array {
        $db = getDB();
        
        $where = ["is_deleted = FALSE"];
        $params = [];
        
        if (!empty($filters['city_id'])) {
            $where[] = "city_id = :city_id";
            $params['city_id'] = $filters['city_id'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Status counts
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM reports
            WHERE $whereClause
        ");
        $stmt->execute($params);
        $statusStats = $stmt->fetch();
        
        // Category counts
        $stmt = $db->prepare("
            SELECT category, COUNT(*) as count
            FROM reports
            WHERE $whereClause
            GROUP BY category
            ORDER BY count DESC
        ");
        $stmt->execute($params);
        $categoryStats = $stmt->fetchAll();
        
        // SLA stats
        $stmt = $db->prepare("
            SELECT 
                SUM(CASE WHEN sla_due_date < NOW() AND status NOT IN ('resolved', 'rejected') THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN sla_due_date >= NOW() AND sla_due_date < DATE_ADD(NOW(), INTERVAL 24 HOUR) AND status NOT IN ('resolved', 'rejected') THEN 1 ELSE 0 END) as due_soon
            FROM reports
            WHERE $whereClause
        ");
        $stmt->execute($params);
        $slaStats = $stmt->fetch();
        
        return [
            'status' => $statusStats,
            'categories' => $categoryStats,
            'sla' => $slaStats
        ];
    }
    
    /**
     * Get report history
     */
    public static function getHistory(string $reportId): array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                h.*,
                p.full_name as changed_by_name
            FROM report_history h
            LEFT JOIN profiles p ON p.id = h.changed_by
            WHERE h.report_id = :report_id
            ORDER BY h.created_at DESC
        ");
        $stmt->execute(['report_id' => $reportId]);
        
        return $stmt->fetchAll();
    }
}

// Router
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'stats') {
            jsonResponse(ReportsAPI::getStats($_GET));
        } elseif ($id && $action === 'history') {
            jsonResponse(ReportsAPI::getHistory($id));
        } elseif ($id) {
            $report = ReportsAPI::getById($id);
            if ($report) {
                jsonResponse($report);
            } else {
                errorResponse('Report not found', 404);
            }
        } else {
            jsonResponse(ReportsAPI::getAll($_GET));
        }
        break;
        
    case 'POST':
        $data = getRequestBody();
        jsonResponse(ReportsAPI::create($data), 201);
        break;
        
    case 'PUT':
    case 'PATCH':
        if (!$id) {
            errorResponse('Report ID required', 400);
        }
        $data = getRequestBody();
        jsonResponse(ReportsAPI::update($id, $data));
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('Report ID required', 400);
        }
        jsonResponse(ReportsAPI::delete($id));
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}
