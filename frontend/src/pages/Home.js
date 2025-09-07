import React, { useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import './Home.css'; 
import cover1 from '../assets/cover1.jpg';
import attachment from '../assets/AttachmentSample.png';

import Footer from '../components/Footer';
import PopularProducts from '../components/PopularProducts';
import { MdNavigateNext } from "react-icons/md";
import { RiDoubleQuotesL, RiDoubleQuotesR  } from "react-icons/ri";
import { GiCannonShot  } from "react-icons/gi";

import AOS from 'aos';
import 'aos/dist/aos.css';

  
const Home = () => {

    const navigate = useNavigate(); 
    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);


    return (
        <div className="home-container">
            
            

            <div className="cover1-container">
                <img src={cover1}
                alt="cover1"
                className="cover1"
                data-aos="fade-right"
                duration="800"
                />
                <div className="cover1-content" data-aos="zoom-out">
                    <p className="content-header1">New Attachment</p>
                    <p className="content-header2">EdGi Custom Works</p>
                    <p className="short-desc">
                        ● Power 
                        ● Range
                        ● Accuracy 
                        ● Durability 
                    </p>

                    
                </div>
            </div>

            <div className='qoute-container' data-aos="fade">
                <GiCannonShot className='qoute-icon'/>
                <p className='quote'><RiDoubleQuotesL /> Accuracy is the ultimate power. Range is a test of precision, <br />
                   and durability is the foundation of every fight. Dominate the field with every shot. <RiDoubleQuotesR /></p>

            </div>


            <div className="popular-products-container" data-aos="fade-up"
            data-aos-anchor-placement="bottom-bottom">
                <PopularProducts />
            </div>
            

            <div className="attachment-container">
            
            <div className="attachment-content">
                <h2 className="attachment-title">Attachment</h2>
                <p className="attachment-description">
                Customizing best parts for your weaponary.
                </p>
                <button onClick={() => navigate("/model")} className="attachment-button">View Attachments</button>
            </div>

            <div className="attachment-image-container">
                <img
                src={attachment}
                alt="Weapon Attachment"
                className="attachment-image"
                />
            </div>

            </div>
            
            <div className="footer-container">
                <Footer />
            </div>

        </div> 
    );
};

export default Home;
