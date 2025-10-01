<?php
require 'vendor/autoload.php'; // Include dotenv if using composer

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = getenv('DB_HOST');
$dbname = getenv('DB_NAME');
$username = getenv('DB_USER');
$password = getenv('DB_PASS');

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    die("Database connection error. Please try again later.");
}

$Purpose = $_POST['Purpose'] ?? '';
$fullName = $_POST['fullName'] ?? '';
$email = $_POST['email'] ?? '';
$phone = $_POST['phone'] ?? '';

if (empty($Purpose) || empty($fullName) || empty($email) || empty($phone)) {
    die("All required fields must be filled.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Invalid email address.");
}

$stmt = $conn->prepare("INSERT INTO inquiries (Purpose, fullName, email, phone) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    error_log("Statement preparation failed: " . $conn->error);
    die("An error occurred while preparing the data.");
}

$stmt->bind_param("ssss", $Purpose, $fullName, $email, $phone);

if ($stmt->execute()) {
    echo "Record saved successfully";
} else {
    error_log("Database insert error: " . $stmt->error);
    die("An error occurred while saving your data.");
}

$stmt->close();
$conn->close();

// Google Sheets API Call
$google_sheets_url = "https://script.google.com/macros/s/AKfycbzkbF_Mf3UVtWd3GdVqIcTnpbxdY7vgpAH6NH72Dfz6SDHS9MZzz5R9hGbp78qzKueb/exec";
$data = compact('Purpose', 'fullName', 'email', 'phone');

$ch = curl_init($google_sheets_url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
if ($response === false) {
    error_log("cURL error: " . curl_error($ch));
    die("Failed to send data to Google Sheets.");
}

$decodedResponse = json_decode($response, true);
if (!$decodedResponse['success']) {
    error_log("Google Sheets API error: " . $decodedResponse['error']);
    die("Failed to send data to Google Sheets. Please try again.");
}

echo "<p>Thank you! Your information has been successfully saved.</p>";
curl_close($ch);
?>
