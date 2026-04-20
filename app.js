/**
 * Production Entry Point Bridge
 * This file redirects the production server to the actual app entry point 
 * located in the /backend folder while maintaining project organization.
 */

// Import the actual application logic
require('./backend/app.js');
