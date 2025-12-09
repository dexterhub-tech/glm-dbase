import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HandshakeIcon, Gift, ArrowRight, Heart } from "lucide-react";
import { useState } from "react";

const Partnership = () => {
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const handleAmountClick = (amount: string) => {
    setDonationAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setDonationAmount("custom");
  };

  const projects = [
    {
      id: 1,
      title: "Youth Center Renovation",
      description: "Help us renovate our youth center to create a modern, welcoming space for our growing youth ministry.",
      goal: 25000,
      raised: 15000,
      image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
    },
    {
      id: 2,
      title: "Community Outreach Program",
      description: "Support our weekly food distribution program that serves over 100 families in our local community.",
      goal: 10000,
      raised: 4500,
      image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    },
    {
      id: 3,
      title: "Mission Trip to Kenya",
      description: "Your support will help send our mission team to Kenya to build a school and provide medical assistance.",
      goal: 35000,
      raised: 21000,
      image: "https://images.unsplash.com/photo-1519923834243-383ff9838b8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="Partnership & Giving"
          subtitle="Join us in spreading God's love through your generous support"
          backgroundImage="https://images.unsplash.com/photo-1549861173-242ce4b90a6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
        />

        {/* Partnership Info */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
              <p className="text-xl text-gray-600">
                Your partnership enables us to continue our mission of spreading the Gospel and serving our community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-red/10 rounded-full flex items-center justify-center mb-4">
                    <Heart size={32} className="text-church-red" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Prayer Partner</h3>
                  <p className="text-gray-600">
                    Join our prayer team to lift up the ministry and support our vision through faithful prayer.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Gift size={32} className="text-church-blue" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Financial Partner</h3>
                  <p className="text-gray-600">
                    Support our ministry through regular tithes, offerings, or one-time donations to specific initiatives.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-church-red/10 rounded-full flex items-center justify-center mb-4">
                    <HandshakeIcon size={32} className="text-church-red" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Volunteer Partner</h3>
                  <p className="text-gray-600">
                    Give your time and talents to serve in various ministries and outreach programs.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="prose prose-lg max-w-none">
              <h3>Why Partner With Us?</h3>
              <p>
                As a partner with Gospel Labour Ministry, you join us in fulfilling the Great Commission. Your support enables us to:
              </p>
              <ul>
                <li>Spread the Gospel through powerful worship services and outreach events</li>
                <li>Provide resources for spiritual growth and discipleship</li>
                <li>Support missionary efforts locally and internationally</li>
                <li>Meet the needs of our community through various service programs</li>
                <li>Maintain and improve our facilities as a welcoming place for worship and fellowship</li>
              </ul>
              <p>
                We believe that giving is an act of worship, and we are committed to being good stewards of every gift entrusted to us. Regular financial reports are available to our members, ensuring transparency and accountability in all we do.
              </p>
            </div>
          </div>
        </section>

        {/* Giving Tabs */}
        <section className="py-16 bg-church-yellow/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Ways to Give</h2>

            <Tabs defaultValue="tithe" className="max-w-4xl mx-auto">
              <TabsList className="grid grid-cols-3 mb-8 w-full">
                <TabsTrigger value="tithe" className="text-lg">Tithe & Offering</TabsTrigger>
                <TabsTrigger value="projects" className="text-lg">Church Projects</TabsTrigger>
                <TabsTrigger value="mission" className="text-lg">Mission Support</TabsTrigger>
              </TabsList>

              <TabsContent value="tithe">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4">Tithe & Offering</h3>
                    <p className="text-gray-600 mb-6">
                      Support the ongoing ministry of Gospel Labour Church through your tithes and offerings. These funds help us maintain our facilities, support our staff, and continue our regular ministry programs.
                    </p>

                    <div className="mb-6">
                      <h4 className="text-xl font-semibold mb-3">Select Amount</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {["20", "50", "100", "200"].map((amount) => (
                          <Button
                            key={amount}
                            type="button"
                            variant={donationAmount === amount ? "default" : "outline"}
                            className={donationAmount === amount ? "bg-church-blue" : ""}
                            onClick={() => handleAmountClick(amount)}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant={donationAmount === "custom" ? "default" : "outline"}
                          className={donationAmount === "custom" ? "bg-church-blue" : ""}
                          onClick={() => setDonationAmount("custom")}
                        >
                          Custom
                        </Button>

                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          className="max-w-[150px]"
                        />
                      </div>
                    </div>

                    <Button className="bg-church-red hover:bg-church-red/90 text-white">
                      Continue to Payment
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4">Church Projects</h3>
                    <p className="text-gray-600 mb-8">
                      Support specific church projects and initiatives. Choose a project below to make a dedicated contribution.
                    </p>

                    <div className="space-y-8">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/3 h-48 md:h-auto">
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="p-6 w-full md:w-2/3">
                              <h4 className="text-xl font-bold mb-2">{project.title}</h4>
                              <p className="text-gray-600 mb-4">{project.description}</p>

                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Raised: ${project.raised.toLocaleString()}</span>
                                  <span>Goal: ${project.goal.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-church-blue h-2.5 rounded-full"
                                    style={{ width: `${(project.raised / project.goal) * 100}%` }}
                                  ></div>
                                </div>
                              </div>

                              <Button className="bg-church-blue hover:bg-church-blue/90 text-white">
                                Support This Project
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mission">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4">Mission Support</h3>
                    <p className="text-gray-600 mb-6">
                      Support our mission work locally and abroad. Your contributions help spread the Gospel and provide critical resources to communities in need.
                    </p>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xl font-semibold mb-3">Message (Optional)</h4>
                        <Textarea
                          placeholder="Share your heart for missions or any specific area you'd like your donation directed toward..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <h4 className="text-xl font-semibold mb-3">Select Amount</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {["50", "100", "500", "1000"].map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant={donationAmount === amount ? "default" : "outline"}
                              className={donationAmount === amount ? "bg-church-blue" : ""}
                              onClick={() => handleAmountClick(amount)}
                            >
                              ${amount}
                            </Button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={donationAmount === "custom" ? "default" : "outline"}
                            className={donationAmount === "custom" ? "bg-church-blue" : ""}
                            onClick={() => setDonationAmount("custom")}
                          >
                            Custom
                          </Button>

                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="max-w-[150px]"
                          />
                        </div>
                      </div>
                    </div>

                    <Button className="bg-church-red hover:bg-church-red/90 text-white mt-6">
                      Support Missions
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Other Ways to Give */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Other Ways to Give</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Mail or In-Person</h3>
                  <p className="text-gray-600 mb-4">
                    You can give by check or cash during our Sunday services or mail your contribution to our church office:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      Gospel Labour Ministry<br />
                      123 Church Street<br />
                      City, State 12345
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Planned Giving</h3>
                  <p className="text-gray-600 mb-4">
                    Consider including Gospel Labour Ministry in your will or estate planning. This type of gift can create a lasting legacy and impact generations to come.
                  </p>
                  <Button variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
                    Learn More <ArrowRight size={16} className="ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Tax Deduction Information</h3>
              <p className="text-gray-600">
                Gospel Labour Ministry is a registered 501(c)(3) non-profit organization. All donations are tax-deductible to the extent allowed by law. Donation receipts will be provided for all contributions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partnership;
