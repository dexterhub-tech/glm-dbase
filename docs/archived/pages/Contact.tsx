
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // In a real app, you would send this data to your backend
    alert("Thank you for your message! We will get back to you soon.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="Contact Us"
          subtitle="We'd love to hear from you. Reach out with any questions, prayer requests, or to connect with our church family."
          backgroundImage="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80"
        />

        {/* Contact Info Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-red/10 rounded-full flex items-center justify-center mb-4">
                    <MapPin size={24} className="text-church-red" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Our Location</h3>
                  <p className="text-gray-600">123 Church Street<br />City, State 12345</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Phone size={24} className="text-church-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Phone</h3>
                  <p className="text-gray-600">(123) 456-7890<br />Mon-Fri, 9am-5pm</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-red/10 rounded-full flex items-center justify-center mb-4">
                    <Mail size={24} className="text-church-red" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Email</h3>
                  <p className="text-gray-600">info@gospellabour.org<br />support@gospellabour.org</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Office Hours */}
        <section className="py-10 bg-church-yellow/10">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock size={28} className="mr-2 text-church-blue" />
              <h2 className="text-2xl font-bold">Office Hours</h2>
            </div>
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold">Monday - Friday</h3>
                <p>9:00 AM - 5:00 PM</p>
              </div>
              <div>
                <h3 className="font-bold">Saturday - Sunday</h3>
                <p>Closed (except for services)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-center">Get In Touch</h2>
              <p className="text-center text-gray-600 mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message..."
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-church-blue hover:bg-church-blue/90 text-white w-full md:w-auto px-8"
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="h-96 bg-gray-200">
          {/* Replace with actual map component in production */}
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Google Maps Integration</h3>
              <p className="text-gray-600">A map showing the church location would be displayed here.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
