import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div>(c) {new Date().getFullYear()} HealthCare+ Management System</div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a> | <a href="#">Terms</a> | <a href="#">FAQ</a>
        </div>
      </div>
    </footer>
  );
}
