<?php
/**
 * CleanAfricaNow Cities API
 * City management endpoints
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

class CitiesAPI {
    
    /**
     * Get all cities
     */
    public static function getAll(array $filters = []): array {
        $db = getDB();
        
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['country'])) {
            $where[] = "country = :country";
            $params['country'] = $filters['country'];
        }
        
        if (!empty($filters['region'])) {
            $where[] = "region = :region";
            $params['region'] = $filters['region'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "name LIKE :search";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $db->prepare("
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM reports r WHERE r.city_id = c.id AND r.is_deleted = FALSE) as reports_count
            FROM cities c
            WHERE $whereClause
            ORDER BY name ASC
        ");
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get single city
     */
    public static function getById(string $id): ?array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM reports r WHERE r.city_id = c.id AND r.is_deleted = FALSE) as reports_count,
                (SELECT COUNT(*) FROM reports r WHERE r.city_id = c.id AND r.status = 'pending' AND r.is_deleted = FALSE) as pending_reports,
                (SELECT COUNT(*) FROM reports r WHERE r.city_id = c.id AND r.status = 'resolved' AND r.is_deleted = FALSE) as resolved_reports
            FROM cities c
            WHERE c.id = :id
        ");
        $stmt->execute(['id' => $id]);
        
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Create city (admin only)
     */
    public static function create(array $data): array {
        Auth::requireRole('admin');
        
        $required = ['name', 'latitude', 'longitude'];
        $missing = validateRequired($data, $required);
        if (!empty($missing)) {
            errorResponse('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        $db = getDB();
        $cityId = generateUUID();
        
        $stmt = $db->prepare("
            INSERT INTO cities (id, name, country, region, latitude, longitude, population, is_municipality)
            VALUES (:id, :name, :country, :region, :latitude, :longitude, :population, :is_municipality)
        ");
        
        $stmt->execute([
            'id' => $cityId,
            'name' => sanitize($data['name']),
            'country' => $data['country'] ?? 'Morocco',
            'region' => $data['region'] ?? null,
            'latitude' => floatval($data['latitude']),
            'longitude' => floatval($data['longitude']),
            'population' => $data['population'] ?? null,
            'is_municipality' => $data['is_municipality'] ?? true
        ]);
        
        return self::getById($cityId);
    }
    
    /**
     * Update city (admin only)
     */
    public static function update(string $id, array $data): array {
        Auth::requireRole('admin');
        
        $db = getDB();
        
        $stmt = $db->prepare("SELECT id FROM cities WHERE id = :id");
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) {
            errorResponse('City not found', 404);
        }
        
        $updates = [];
        $params = ['id' => $id];
        
        $allowedFields = ['name', 'country', 'region', 'latitude', 'longitude', 'population', 'is_municipality'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[$field] = $field === 'name' ? sanitize($data[$field]) : $data[$field];
            }
        }
        
        if (empty($updates)) {
            return self::getById($id);
        }
        
        $updateClause = implode(', ', $updates);
        $stmt = $db->prepare("UPDATE cities SET $updateClause WHERE id = :id");
        $stmt->execute($params);
        
        return self::getById($id);
    }
    
    /**
     * Delete city (admin only)
     */
    public static function delete(string $id): array {
        Auth::requireRole('admin');
        
        $db = getDB();
        
        $stmt = $db->prepare("DELETE FROM cities WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('City not found', 404);
        }
        
        return ['success' => true, 'message' => 'City deleted'];
    }
    
    /**
     * Get regions list
     */
    public static function getRegions(): array {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT 
                region,
                COUNT(*) as city_count,
                SUM(population) as total_population
            FROM cities
            WHERE region IS NOT NULL
            GROUP BY region
            ORDER BY region
        ");
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
        if ($action === 'regions') {
            jsonResponse(CitiesAPI::getRegions());
        } elseif ($id) {
            $city = CitiesAPI::getById($id);
            if ($city) {
                jsonResponse($city);
            } else {
                errorResponse('City not found', 404);
            }
        } else {
            jsonResponse(CitiesAPI::getAll($_GET));
        }
        break;
        
    case 'POST':
        $data = getRequestBody();
        jsonResponse(CitiesAPI::create($data), 201);
        break;
        
    case 'PUT':
    case 'PATCH':
        if (!$id) {
            errorResponse('City ID required', 400);
        }
        $data = getRequestBody();
        jsonResponse(CitiesAPI::update($id, $data));
        break;
        
    case 'DELETE':
        if (!$id) {
            errorResponse('City ID required', 400);
        }
        jsonResponse(CitiesAPI::delete($id));
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}
