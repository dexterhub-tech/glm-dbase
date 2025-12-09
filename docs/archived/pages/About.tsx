
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import { Card, CardContent } from "@/components/ui/card";


const About = () => {
  // Fetch real pastors from the database instead of using dummy data
  const pastors = [];

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="About Our Church"
          subtitle="Learn about our history, mission, and the people who make Gospel Labour Ministry special"
          backgroundImage="https://images.unsplash.com/photo-1490127252417-7c393f993ee4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
        />

        {/* Our History */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Our History</h2>
              <div className="prose prose-lg max-w-none">
                <p>
                  Founded in 1985, Gospel Labour Ministry began as a small prayer group meeting in the living room of our founding pastor, Rev. Thomas Anderson. With just twelve dedicated believers, the group grew steadily as they committed to studying God's Word and serving their community.
                </p>
                <p>
                  By 1990, the congregation had grown to over 100 members and moved into its first official building. Over the next decade, Gospel Labour Ministry continued to expand its reach and impact in the community through various outreach programs, missions work, and spiritual development initiatives.
                </p>
                <p>
                  In 2005, we moved to our current location, which has allowed us to grow to over 500 members and expand our ministries to meet the diverse needs of our congregation and community. Throughout our history, we have remained committed to our founding principles of authentic worship, biblical teaching, meaningful fellowship, and compassionate service.
                </p>
                <p>
                  Today, Gospel Labour Ministry continues to be a beacon of light and hope in our community, with a focus on making disciples who make a difference wherever they go.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Beliefs */}
        <section className="py-16 bg-church-yellow/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Our Beliefs</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-red">The Bible</h3>
                  <p className="text-gray-700">
                    We believe the Bible is God's Word, fully inspired and without error, and is the final authority for faith and life.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-blue">God</h3>
                  <p className="text-gray-700">
                    We believe in one God who exists eternally in three persons: Father, Son, and Holy Spirit.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-red">Jesus Christ</h3>
                  <p className="text-gray-700">
                    We believe in the deity of Jesus Christ, His virgin birth, sinless life, miracles, atoning death, bodily resurrection, and future return.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-blue">Salvation</h3>
                  <p className="text-gray-700">
                    We believe salvation is by grace through faith in Jesus Christ alone, not by works or human effort.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-red">Holy Spirit</h3>
                  <p className="text-gray-700">
                    We believe in the present ministry of the Holy Spirit, who indwells believers and empowers them to live godly lives.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3 text-church-blue">The Church</h3>
                  <p className="text-gray-700">
                    We believe the Church is the body of Christ, composed of all believers, and exists to worship God and make disciples.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Our Leadership</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastors.length > 0 ? (
                pastors.map((pastor) => (
                  <div key={pastor.id} className="flex flex-col items-center text-center">
                    <div className="w-48 h-48 rounded-full overflow-hidden mb-4">
                      <img
                        src={pastor.image}
                        alt={pastor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{pastor.name}</h3>
                    <p className="text-church-red font-medium mb-3">{pastor.title}</p>
                    <p className="text-gray-600">{pastor.bio}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-600">Our leadership team information will be available soon.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Service Times */}
        <section className="py-16 bg-church-blue text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-10">Service Times</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <h3 className="text-xl font-bold mb-2">Sunday</h3>
                <p>9:00 AM & 11:00 AM</p>
                <p className="opacity-80">Main Sanctuary</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Wednesday</h3>
                <p>7:00 PM</p>
                <p className="opacity-80">Bible Study & Prayer</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Friday</h3>
                <p>6:30 PM</p>
                <p className="opacity-80">Youth Service</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
