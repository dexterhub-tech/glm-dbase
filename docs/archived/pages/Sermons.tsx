
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import SermonCard from "@/components/SermonCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Sermons = () => {
  // Sermons should be fetched from the database
  // For now, use an empty array
  const sermons = [] as const;

  // Filter sermons by type
  const videoSermons = sermons.filter((sermon) => sermon.type === "video");
  const audioSermons = sermons.filter((sermon) => sermon.type === "audio");
  const textSermons = sermons.filter((sermon) => sermon.type === "text");

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero
          title="Sermon Library"
          subtitle="Explore our collection of messages to deepen your faith and understanding"
          backgroundImage="https://images.unsplash.com/photo-1536893827774-411e1dc7c902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
        />

        {/* Search Section */}
        <section className="py-10 bg-church-blue/10">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="Search sermons by title, speaker, or topic..."
                  className="border-church-blue/30 focus-visible:ring-church-blue"
                />
                <Button className="bg-church-red hover:bg-church-red/90 text-white">
                  <Search size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sermon Tabs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList>
                  <TabsTrigger value="all" className="text-lg px-5">All</TabsTrigger>
                  <TabsTrigger value="video" className="text-lg px-5">Video</TabsTrigger>
                  <TabsTrigger value="audio" className="text-lg px-5">Audio</TabsTrigger>
                  <TabsTrigger value="text" className="text-lg px-5">Text</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sermons.length > 0 ? (
                    sermons.map((sermon) => (
                      <SermonCard
                        key={sermon.id}
                        id={sermon.id}
                        title={sermon.title}
                        speaker={sermon.speaker}
                        date={sermon.date}
                        type={sermon.type}
                        image={sermon.image}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-gray-600">No sermons available at this time. Please check back later.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videoSermons.length > 0 ? (
                    videoSermons.map((sermon) => (
                      <SermonCard
                        key={sermon.id}
                        id={sermon.id}
                        title={sermon.title}
                        speaker={sermon.speaker}
                        date={sermon.date}
                        type={sermon.type}
                        image={sermon.image}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-gray-600">No video sermons available at this time.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audio">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {audioSermons.length > 0 ? (
                    audioSermons.map((sermon) => (
                      <SermonCard
                        key={sermon.id}
                        id={sermon.id}
                        title={sermon.title}
                        speaker={sermon.speaker}
                        date={sermon.date}
                        type={sermon.type}
                        image={sermon.image}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-gray-600">No audio sermons available at this time.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="text">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {textSermons.length > 0 ? (
                    textSermons.map((sermon) => (
                      <SermonCard
                        key={sermon.id}
                        id={sermon.id}
                        title={sermon.title}
                        speaker={sermon.speaker}
                        date={sermon.date}
                        type={sermon.type}
                        image={sermon.image}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-gray-600">No text sermons available at this time.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Subscribe Section */}
        <section className="py-16 bg-church-yellow/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Never Miss a Message</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Subscribe to receive our latest sermons directly in your inbox every week.
            </p>

            <div className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Your email address"
                  type="email"
                  className="sm:flex-1"
                />
                <Button className="bg-church-blue hover:bg-church-blue/90 text-white">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sermons;
