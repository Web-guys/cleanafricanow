<?php
/**
 * CleanAfricaNow Authentication API
 * JWT-based authentication for MySQL/cPanel
 */

require_once __DIR__ . '/config.php';

/**
 * JWT Token Handler
 */
class JWT {
    
    /**
     * Encode payload to JWT token
     */
    public static function encode(array $payload): string {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => JWT_ALGORITHM
        ]));
        
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true)
        );
        
        return "$header.$payloadEncoded.$signature";
    }
    
    /**
     * Decode and verify JWT token
     */
    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        [$header, $payload, $signature] = $parts;
        
        // Verify signature
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }
        
        $data = json_decode(self::base64UrlDecode($payload), true);
        
        // Check expiration
        if (isset($data['exp']) && $data['exp'] < time()) {
            return null;
        }
        
        return $data;
    }
    
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

/**
 * Auth Handler
 */
class Auth {
    
    /**
     * Register new user
     */
    public static function register(array $data): array {
        $required = ['email', 'password', 'full_name'];
        $missing = validateRequired($data, $required);
        if (!empty($missing)) {
            errorResponse('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
        if (!$email) {
            errorResponse('Invalid email address', 400);
        }
        
        if (strlen($data['password']) < 8) {
            errorResponse('Password must be at least 8 characters', 400);
        }
        
        $db = getDB();
        
        // Check if email exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            errorResponse('Email already registered', 409);
        }
        
        // Create user
        $userId = generateUUID();
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        try {
            $db->beginTransaction();
            
            // Insert user
            $stmt = $db->prepare("
                INSERT INTO users (id, email, password_hash, email_confirmed_at, raw_user_meta_data)
                VALUES (:id, :email, :password_hash, NOW(), :meta_data)
            ");
            $stmt->execute([
                'id' => $userId,
                'email' => $email,
                'password_hash' => $passwordHash,
                'meta_data' => json_encode(['full_name' => $data['full_name']])
            ]);
            
            // Profile and role are created by trigger, but let's ensure they exist
            $stmt = $db->prepare("SELECT id FROM profiles WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            if (!$stmt->fetch()) {
                // Insert profile manually if trigger didn't fire
                $stmt = $db->prepare("
                    INSERT INTO profiles (id, full_name, email)
                    VALUES (:id, :full_name, :email)
                ");
                $stmt->execute([
                    'id' => $userId,
                    'full_name' => $data['full_name'],
                    'email' => $email
                ]);
                
                $stmt = $db->prepare("
                    INSERT INTO user_roles (id, user_id, role)
                    VALUES (:id, :user_id, 'citizen')
                ");
                $stmt->execute([
                    'id' => generateUUID(),
                    'user_id' => $userId
                ]);
            }
            
            $db->commit();
            
            // Generate token
            $token = JWT::encode([
                'sub' => $userId,
                'email' => $email,
                'role' => 'authenticated'
            ]);
            
            // Get user data
            $user = self::getUserById($userId);
            
            logActivity($userId, 'user_registered');
            
            return [
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWT_EXPIRY
            ];
            
        } catch (Exception $e) {
            $db->rollBack();
            error_log("Registration error: " . $e->getMessage());
            errorResponse('Registration failed', 500);
        }
    }
    
    /**
     * Login user
     */
    public static function login(array $data): array {
        $required = ['email', 'password'];
        $missing = validateRequired($data, $required);
        if (!empty($missing)) {
            errorResponse('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT id, email, password_hash, is_active
            FROM users 
            WHERE email = :email
        ");
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            errorResponse('Invalid email or password', 401);
        }
        
        if (!$user['is_active']) {
            errorResponse('Account is disabled', 403);
        }
        
        // Update last login
        $stmt = $db->prepare("UPDATE users SET last_sign_in_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        
        $stmt = $db->prepare("UPDATE profiles SET last_login_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        
        // Generate token
        $token = JWT::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => 'authenticated'
        ]);
        
        // Store session
        $sessionId = generateUUID();
        $stmt = $db->prepare("
            INSERT INTO user_sessions (id, user_id, token, expires_at, ip_address, user_agent)
            VALUES (:id, :user_id, :token, :expires_at, :ip_address, :user_agent)
        ");
        $stmt->execute([
            'id' => $sessionId,
            'user_id' => $user['id'],
            'token' => $token,
            'expires_at' => date('Y-m-d H:i:s', time() + JWT_EXPIRY),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        $userData = self::getUserById($user['id']);
        
        logActivity($user['id'], 'user_login');
        
        return [
            'user' => $userData,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWT_EXPIRY
        ];
    }
    
    /**
     * Logout user
     */
    public static function logout(): array {
        $user = self::getCurrentUser();
        if ($user) {
            $db = getDB();
            $stmt = $db->prepare("DELETE FROM user_sessions WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $user['id']]);
            logActivity($user['id'], 'user_logout');
        }
        return ['success' => true];
    }
    
    /**
     * Get current authenticated user from request
     */
    public static function getCurrentUser(): ?array {
        $token = self::getBearerToken();
        if (!$token) {
            return null;
        }
        
        $payload = JWT::decode($token);
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }
        
        return self::getUserById($payload['sub']);
    }
    
    /**
     * Require authentication - returns user or exits with 401
     */
    public static function requireAuth(): array {
        $user = self::getCurrentUser();
        if (!$user) {
            errorResponse('Unauthorized', 401);
        }
        return $user;
    }
    
    /**
     * Require specific role
     */
    public static function requireRole(string $role): array {
        $user = self::requireAuth();
        if (!in_array($role, $user['roles'])) {
            errorResponse('Forbidden - insufficient permissions', 403);
        }
        return $user;
    }
    
    /**
     * Check if user has role
     */
    public static function hasRole(string $userId, string $role): bool {
        $db = getDB();
        $stmt = $db->prepare("SELECT 1 FROM user_roles WHERE user_id = :user_id AND role = :role");
        $stmt->execute(['user_id' => $userId, 'role' => $role]);
        return (bool) $stmt->fetch();
    }
    
    /**
     * Get user by ID with roles
     */
    public static function getUserById(string $id): ?array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.email,
                u.created_at,
                u.last_sign_in_at,
                p.full_name,
                p.phone,
                p.avatar_url,
                p.bio,
                p.city_id,
                p.impact_score,
                p.reports_count,
                p.preferred_language,
                p.is_active
            FROM users u
            LEFT JOIN profiles p ON p.id = u.id
            WHERE u.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return null;
        }
        
        // Get roles
        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $id]);
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $user['roles'] = $roles;
        
        return $user;
    }
    
    /**
     * Get Bearer token from Authorization header
     */
    private static function getBearerToken(): ?string {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Change password
     */
    public static function changePassword(array $data): array {
        $user = self::requireAuth();
        
        $required = ['current_password', 'new_password'];
        $missing = validateRequired($data, $required);
        if (!empty($missing)) {
            errorResponse('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        if (strlen($data['new_password']) < 8) {
            errorResponse('New password must be at least 8 characters', 400);
        }
        
        $db = getDB();
        
        // Verify current password
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        $userData = $stmt->fetch();
        
        if (!password_verify($data['current_password'], $userData['password_hash'])) {
            errorResponse('Current password is incorrect', 401);
        }
        
        // Update password
        $newHash = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
        $stmt->execute(['hash' => $newHash, 'id' => $user['id']]);
        
        logActivity($user['id'], 'password_changed');
        
        return ['success' => true, 'message' => 'Password changed successfully'];
    }
}

// Router for auth endpoints
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        $data = getRequestBody();
        switch ($path) {
            case 'register':
                jsonResponse(Auth::register($data));
                break;
            case 'login':
                jsonResponse(Auth::login($data));
                break;
            case 'logout':
                jsonResponse(Auth::logout());
                break;
            case 'change-password':
                jsonResponse(Auth::changePassword($data));
                break;
            default:
                errorResponse('Unknown auth action', 404);
        }
        break;
        
    case 'GET':
        switch ($path) {
            case 'me':
                $user = Auth::getCurrentUser();
                if ($user) {
                    jsonResponse(['user' => $user]);
                } else {
                    jsonResponse(['user' => null]);
                }
                break;
            default:
                errorResponse('Unknown auth action', 404);
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}
