import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import ImageWithFallback from "@/components/ui/image-with-fallback";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperUser } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Add scroll listener on mount
    window.addEventListener('scroll', handleScroll);
    
    // Clean up on unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMenuOpen) return;
      const target = event.target as Node | null;
      const headerEl = headerRef.current;
      if (headerEl && target && !headerEl.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navItems = [
    { name: "About", path: "/about" },
    { name: "Events", path: "/events" },
    { name: "Sermons", path: "/sermons" },
    { name: "Contact", path: "/contact" },
    { name: "Partnership", path: "/partnership" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Determine if we should show black background immediately
  const isNotIndex = location.pathname !== "/";
  const shouldShowBlackBg = isScrolled || isNotIndex;

  return (
    <header ref={headerRef} className={`fixed w-full top-0 z-50 transition-all duration-300 ${shouldShowBlackBg ? 'bg-black shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <ImageWithFallback 
            src="/images/logo 2.png" 
            alt="Gospel Labour Ministry" 
            className={`transition-all duration-300 ${shouldShowBlackBg ? 'h-16' : 'h-20'}`}
            fallbackSrc="/images/logo.png"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`hover-underline transition-colors py-2 ${
                location.pathname === item.path
                  ? "text-church-red font-medium"
                  : "text-gray-50"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center space-x-4">
              {(isAdmin || isSuperUser) && (
                <Button
                  onClick={() => navigate("/admin")}
                  className={`${
                    isSuperUser 
                      ? "bg-gradient-to-r from-yellow-500 to-[#ff0000] hover:from-[#ff0000] hover:to-yellow-700 text-black font-medium" 
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                  } px-4 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg`}
                  size="sm"
                >
                  {isSuperUser ? "Super Admin" : "Admin"}
                </Button>
              )}
              <UserAvatar />
            </div>
          ) : (
            <Button
              className="bg-church-red px-10 py-6 hover:bg-church-red/90 text-white"
              onClick={() => navigate("/auth/login")}
            >
              Login
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button and User Avatar */}
        <div className="md:hidden flex items-center space-x-3">
          {user && <UserAvatar />}
          <button
            className="text-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-2 transition-colors hover:bg-white/10"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`md:hidden bg-white border-t transition-all duration-300 ease-in-out ${
        isMenuOpen 
          ? 'max-h-screen opacity-100 visible' 
          : 'max-h-0 opacity-0 invisible overflow-hidden'
      }`}>
        <div className="container mx-auto px-4 py-4 flex flex-col space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* User section at top for mobile */}
            {user ? (
              <div className="border-b border-gray-200 pb-4 mb-2">
                <div className="flex items-center space-x-3 px-4 py-2">
                  <UserAvatar />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">Logged in</p>
                  </div>
                </div>
                {(isAdmin || isSuperUser) && (
                  <div className="px-4 mt-3">
                    <Button
                      onClick={() => {
                        navigate("/admin");
                        setIsMenuOpen(false);
                      }}
                      className={`w-full ${
                        isSuperUser 
                          ? "bg-gradient-to-r from-yellow-500 to-[#ff0000] hover:from-[#ff0000] hover:to-yellow-700 text-black font-medium" 
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                      }`}
                      size="sm"
                    >
                      {isSuperUser ? "Super Admin Dashboard" : "Admin Dashboard"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-b border-gray-200 pb-4 mb-2">
                <Button
                  className="bg-church-red hover:bg-church-red/90 text-white w-full"
                  onClick={() => {
                    navigate("/auth/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </Button>
              </div>
            )}
            
            {/* Navigation items */}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`py-2 px-4 rounded-md ${
                  location.pathname === item.path
                    ? "bg-gray-100 text-church-red font-medium"
                    : "text-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
    </header>
  );
};

export default Header;