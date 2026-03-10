<?php
if (!defined('APP_TIMEZONE'))
{
    define('APP_TIMEZONE', 'Asia/Kolkata');
}
date_default_timezone_set(APP_TIMEZONE);
 
#Email Configuration
define('SMTP_HOST', 'smtppro.zoho.in');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'rjadhav@xtsworld.in'); // Change this
define('SMTP_PASSWORD', 'h04ujEHDCRdJ'); // Change this (use App Password for Gmail)
define('SMTP_FROM_EMAIL', 'rjadhav@xtsworld.in'); // Change this
define('SMTP_FROM_NAME', 'Interview Hub');
 
// HR Email
define('HR_EMAIL', 'rjadhav@xtsworld.in'); // Change this to HR email address
 
// App URL used in email links
if (!defined('APP_BASE_URL'))
{
    define('APP_BASE_URL', 'http://localhost/xts_InterviewPortal/backend/');
}
 
// Frontend URL for password reset
if (!defined('FRONTEND_URL'))
{
    define('FRONTEND_URL', 'http://localhost:3000/');
}
 
// Secret for signing invite action tokens (change in production)
if (!defined('INVITE_SECRET'))
{
    define('INVITE_SECRET', 'change-this-to-a-long-random-secret');
}
?>
