import React from 'react';
import { FaFacebook } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import logo from '../assets/EdgiLogo-white.png';
import './Footer.css'; 

const Footer = () => {
    return (
        <div className='footer-page'>
        <footer className='footer'>
            <div className='footer-reminder'>
                <h3>Terms and Policies</h3>
                <ul>
                    <li><a href="/about-us">Terms of Service</a></li>
                    <li><a href="/about-us">Privacy Policy</a></li>
                    <li><a href="/about-us">No refund Policy</a></li>
                </ul>
            </div>

            <div className='footer-links'>
                <h3>Quick Links</h3>
                <ul>
                    <li><a href="/about-us">About Us</a></li>
                    <li><a href="/shop">Shop</a></li>
                    <li><a href="/model">3D Attachment</a></li>
                    <li><a href="/assistant">Assistant</a></li>
                </ul>
            </div>

            
            <div className='footer-content'>
                <h3>Contact Us Directly</h3>
                <ul className='social-links'>
                    <li><a href="https://www.facebook.com/EdGICustomWorks" target="_blank" rel="noopener noreferrer"><FaFacebook className='footer-social-icons'/> facebook.com/EdGICustomWorks</a></li>
                    <li><a href="edgicustomworks100@gmail.com" target="_blank" rel="noopener noreferrer"><MdEmail className='footer-social-icons'/> edgicustomworks@gmail.com</a></li>
                    
                </ul>
            </div>
            
            
        </footer>

        <div className='footer-credits'>
                <p>&copy; 2025 EdGI Custom Works. All rights reserved.</p>
                <p>Designed by AirsoftTech</p>
            </div>
        </div>
    );
};


export default Footer;