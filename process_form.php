<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and validate user inputs
    $purpose = htmlspecialchars(trim($_POST['Purpose'] ?? ''));
    $howHeard = htmlspecialchars(trim($_POST['howHeard'] ?? ''));
    $fullName = htmlspecialchars(trim($_POST['fullName'] ?? ''));
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $address = htmlspecialchars(trim($_POST['address'] ?? ''));
    $addressLine2 = htmlspecialchars(trim($_POST['addressLine2'] ?? ''));
    $city = htmlspecialchars(trim($_POST['city'] ?? ''));
    $state = htmlspecialchars(trim($_POST['state'] ?? ''));
    $phone = htmlspecialchars(trim($_POST['phone'] ?? ''));
    $inquiry = htmlspecialchars(trim($_POST['Inquiry'] ?? ''));

    // Validate required fields
    $errors = [];
    if (empty($purpose)) $errors[] = "Purpose is required.";
    if (empty($howHeard)) $errors[] = "How you heard about us is required.";
    if (empty($fullName)) $errors[] = "Full Name is required.";
    if (empty($email)) $errors[] = "Email is required.";
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Invalid email address.";
    if (empty($inquiry)) $errors[] = "Inquiry description is required.";

    if (!empty($errors)) {
        echo json_encode(["status" => "error", "errors" => $errors]);
        exit;
    }

    // Email preparation
    $to = "admin@primoinstallations.com"; // Admin email
    $subject = "New Contact Form Submission from $fullName";
    $message = "Purpose: $purpose\n"
             . "Heard About Us: $howHeard\n"
             . "Name: $fullName\n"
             . "Email: $email\n"
             . "Address: $address, $addressLine2, $city, $state\n"
             . "Phone: $phone\n"
             . "Inquiry: $inquiry";
    $headers = [
        "From: no-reply@primoinstallations.com",
        "Reply-To: $email",
        "Content-Type: text/plain; charset=UTF-8",
        "X-Mailer: PHP/" . phpversion()
    ];

    // Attempt to send email
    $emailStatus = mail($to, $subject, $message, implode("\r\n", $headers));
    $emailResponse = $emailStatus ? "Email sent successfully." : "Email failed to send.";

    // Google Apps Script integration
    $scriptUrl = "https://script.google.com/macros/s/AKfycbzkbF_Mf3UVtWd3GdVqIcTnpbxdY7vgpAH6NH72Dfz6SDHS9MZzz5R9hGbp78qzKueb/exec";
    $postData = [
        'Purpose' => $purpose,
        'howHeard' => $howHeard,
        'fullName' => $fullName,
        'email' => $email,
        'address' => $address,
        'addressLine2' => $addressLine2,
        'city' => $city,
        'state' => $state,
        'phone' => $phone,
        'Inquiry' => $inquiry,
    ];

    // Send data to Google Apps Script
    $ch = curl_init($scriptUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $googleResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $googleSheetStatus = $httpCode == 200 ? "Google Sheet updated successfully." : "Failed to update Google Sheet.";

    // Consolidate responses
    echo json_encode([
        "status" => "success",
        "emailStatus" => $emailResponse,
        "googleSheetStatus" => $googleSheetStatus,
        "googleResponse" => json_decode($googleResponse, true),
    ]);
}
?>
