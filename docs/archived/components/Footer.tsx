
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 text-white">Gospel Labour Ministry</h3>
            <p className="text-gray-300 mb-4">
              Spreading God's love and message through community, worship, and service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-church-blue transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-church-blue transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-church-blue transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-church-blue transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/sermons" className="text-gray-300 hover:text-white transition-colors">
                  Sermons
                </Link>
              </li>
              <li>
                <Link to="/partnership" className="text-gray-300 hover:text-white transition-colors">
                  Partnership
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/admin-access" className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm">
                  Admin Access
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Service Times */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 text-white">Service Times</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <span className="font-medium">Sunday:</span> 8:00 AM 
              </li>
              <li>
                <span className="font-medium">Wednesday:</span> 4:00 PM
              </li>
              <li>
                <span className="font-medium">First Saturday (TAKE-IT):</span> 8:00 AM
              </li>
            </ul>
          </div>
          
          {/* Column 4: Contact */}
          <div>
            <h3 className="font-serif text-xl font-bold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 mt-1 flex-shrink-0" />
                <span>Upper Room, GLM Auditorium, Off Housing RD, Olora Layout, Adebayo, Ado Ekiti, Ekiti</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0" />
                <span>09031996431, 07085430447</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 flex-shrink-0" />
                <span>info@gospellabour.org</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Gospel Labour Ministry. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
