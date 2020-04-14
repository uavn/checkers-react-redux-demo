<?php

// This is just for the demo purposes, it is far from being ready for production use

ini_set('display_errors', 1);

class App 
{
    public static function render(array $response) 
    {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin:*');//@TODO
        echo json_encode($response);
        die;
    }

    public static function list(): array
    {
        $maxIterations = 1;
        $userId = $_GET['userId'];
        $lastUpdateTime = $_GET['time'] ?? 0;

        while ($maxIterations >= 0) {
            if (self::getDbUpdatedTime('games') > $lastUpdateTime) {// || $maxIterations === 0
                $games = self::getDb('games', function(?array $data) {
                    return $data;
                });

                $connectToGame = array_values(array_filter($games, function(array $game) use ($userId) {
                    return ($game['started'] && $game['userId'] === $userId);
                }));

                return [
                    'time' => self::getDbUpdatedTime('games'),
                    'games' => self::sortFilterGames($games),
                    'connectToGame' => ($connectToGame && $connectToGame[0] && $connectToGame[0]['id']) ? $connectToGame[0] : null,
                ];
            } else {
                return [
                    'time' => $lastUpdateTime,
                ];
            }

            if ($maxIterations === 1) {
                sleep(1);
            }
            $maxIterations--;
        }

        // Should never get here
        throw new Exception('Error');
    }

    public static function add(): array
    {
        $post = json_decode(file_get_contents('php://input'), true);

        $name = $post['name'] ?? null;
        $userId = $post['userId'] ?? null;

        if (!$userId) {
            throw new Exception('An error occured');
        }
    
        $games = self::getDb('games', function(?array $data) use ($name, $userId) {
            $newId = uniqid();
            $data[$newId] = [
                'id' => $newId,
                'name' => trim($name ?: 'Нова гра ' . ($data ? count($data) : '')),
                'date' => date('Y-m-d H:i:s'),
                'started' => false,
                'userId' => $userId,
            ];
            self::saveDb('games', $data);

            return self::sortFilterGames($data);
        });
        
        return $games;
    }

    public static function start(): array
    {
        $post = json_decode(file_get_contents('php://input'), true);

        $gameId = $post['gameId'] ?? null;
        $userId = $post['userId'] ?? null;

        if (!$gameId || !$userId) {
            throw new Exception('An error occured');
        }
    
        $games = self::getDb('games', function(?array $data) use ($gameId, $userId) {
            if ($data[$gameId] ?? null) {
                $data[$gameId]['started'] = true;
            }

            self::saveDb('games', $data);

            return self::sortFilterGames($data);
        });
        
        return $games;
    }

    public static function step(): array
    {
        $post = json_decode(file_get_contents('php://input'), true);

        $gameId = $post['gameId'] ?? null;
        $from = $post['from'] ?? null;
        $to = $post['to'] ?? null;
        $color = $post['color'] ?? null;

        if (!$gameId || !$from || !$to || !$color) {
            throw new Exception('An error occured');
        }
    
        $games = self::getDb('games', function(?array $data) {
            return $data;
        });

        $game = array_values(array_filter($games, function(array $game) use ($gameId) {
            return ($game['started'] && $game['id'] === $gameId);
        }));

        if (($game && $game[0] && $game[0]['id'])) {
            if (!isset($game[0]['steps'])) {
                $game[0]['steps'] = [];
            }

            // $games[$game[0]['id']]['steps'] = [];
            $games[$game[0]['id']]['steps'][] = ['from' => $from, 'to' => $to, 'color' => $color];

            self::saveDb('games', $games);

            return [
                'ok' => true
            ];
        }

        return [
            'ok' => false
        ];
    }

    public static function game(): array
    {
        $gameId = $_GET['gameId'];
        $lastUpdateTime = $_GET['time'] ?? 0;

        if (self::getDbUpdatedTime('games') > $lastUpdateTime) {
            $games = self::getDb('games', function(?array $data) {
                return $data;
            });

            $game = array_values(array_filter($games, function(array $game) use ($gameId) {
                return ($game['started'] && $game['id'] === $gameId);
            }));

            return [
                'time' => self::getDbUpdatedTime('games'),
                'game' => ($game && $game[0] && $game[0]['id']) ? $game[0] : null,
            ];
        }

        return [
            'time' => $lastUpdateTime,
        ];
    }

    private static function sortFilterGames(array $games) {
        return array_filter(array_reverse(array_values($games)), function(array $game) {
            return !($game['started'] ?? false) && (new DateTime($game['date']) > new DateTime('-5 min'));
        });
    }

    private static function getDbUpdatedTime(string $db) {
        return file_exists(__DIR__ . "/db/{$db}") ? filemtime(__DIR__ . "/db/{$db}") : 0;
    }

    private static function saveDb(string $db, array $data) 
    {
        file_put_contents(__DIR__ . '/db/' . $db, json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    private static function getDb(string $db, Callable $callback): array
    {
        if (!file_exists(__DIR__ . "/db/{$db}")) {
            self::saveDb($db, []);
        }

        $maxAttempts = 10;
        $attempt = 0;
        $done = false;
        $error = null;
        $data = [];

        while (!$done) {
            if (file_exists(__DIR__ . "/db/{$db}.lock")) {
                sleep(1);
                $attempt++;

                if ($attempt >= $maxAttempts) {
                    $done = true;
                    $error = true;
                }
    
                continue;
            }

            file_put_contents(__DIR__ . "/db/{$db}.lock", 1);

            $data = json_decode(file_get_contents(__DIR__ . '/db/' . $db), true);
            $data = $callback($data);

            unlink(__DIR__ . "/db/{$db}.lock");
            $done = true;
        }

        if ($error) {
            throw new Exception($error ?: 'DB Locked, try another time.');
        }

        return $data ?: [];
    }
}

$action = $_GET['action'] ?? 'error';

$routes = [
    'list' => function() {return App::list();},
    'add' => function() {return App::add();},
    'start' => function() {return App::start();},
    'step' => function() {return App::step();},
    'game' => function() {return App::game();},
];

$response = isset($routes[$action]) ? $routes[$action]() : [];

if (!is_null($response)) {
    App::render($response);
}

throw new Exception('An error occured!');
