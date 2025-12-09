
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { useRecentSermons } from "@/hooks/useSermons";
import ImageWithFallback from "@/components/ui/image-with-fallback";
import VideoWithFallback from "@/components/ui/video-with-fallback";

const Index = () => {
  // Fetch real events from database
  const { events: upcomingEvents, loading: eventsLoading } = useUpcomingEvents(6);

  // Fetch real sermons from database
  const { sermons: recentSermons, loading: sermonsLoading } = useRecentSermons(3);

  // Format events for display
  const formattedEvents = upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: event.is_recurring
      ? `Every ${event.recurrence_pattern === 'weekly' ? 'Week' : 'Month'}`
      : new Date(event.event_date).toLocaleDateString(),
    time: event.start_time || "TBA",
    location: event.location || "TBA",
    image: event.image_url || "https://images.unsplash.com/photo-1507036066871-b7e8032b3dea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1032&q=80"
  }));

  // Format sermons for display
  const formattedSermons = recentSermons.map(sermon => ({
    id: sermon.id,
    title: sermon.title || 'Untitled Sermon',
    speaker: sermon.speaker || 'Unknown Speaker',
    date: sermon.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Date TBD',
    type: sermon.sermon_type || 'sermon',
    image: sermon.image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
  }));

  return (
    <div className="min-h-screen overflow-hidden flex flex-col">
      <main className="flex-grow">
        <Hero
          title="Welcome to Gospel Labour Ministry"
          subtitle="Join us as we spread God's love through worship and service"
          ctaText="Join Us This Sunday"
          ctaLink="/about"
          backgroundImage="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80"
        />

        <div className="bg-white py-12 sm:py-16 px-4" data-aos="fade-up">
          {/* Right-aligned heading section */}
          <div className="max-w-6xl mx-auto mb-8 sm:mb-12 text-center sm:text-right" data-aos="fade-right">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black inline-block pb-2">
              This is Church!
            </h2>
            <div className="w-32 h-1 bg-church-red mx-auto sm:ml-auto"></div>
            <p className="text-lg text-gray-600 mt-4">
              Our mission is to inspire, uplift, and bring people closer to God through faith, love, and service.
            </p>
          </div>

          {/* Grid cards with embedded message */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">

            {/* Card 1 - Contains "I" */}
            <div
              className="border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              data-aos="zoom-in"
            >
              <ImageWithFallback
                src="https://res.cloudinary.com/dsaqsxtup/image/upload/v1746371168/584_g8yxvz.jpg"
                alt="Worship"
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">Deep Worship</h3>
                <p className="text-gray-600 mb-4">
                  <span className="text-church-red font-bold">I</span>n our worship, we connect hearts to God through authentic spiritual experiences.
                </p>
                <button className="text-church-red font-medium px-0 py-2 hover:underline focus:outline-none focus:ring-2 focus:ring-church-red focus:ring-opacity-50 rounded">
                  Learn more
                </button>
              </div>
            </div>

            {/* Card 2 - Contains "LOVE" */}
            <div
              className="border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              data-aos="zoom-in"
              data-aos-delay="100"
            >
              <ImageWithFallback
                src="https://res.cloudinary.com/dsaqsxtup/image/upload/v1746373650/2149187035_zlg8tp.jpg"
                alt="Community"
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">Edifying Fellowship</h3>
                <p className="text-gray-600 mb-4">
                  We <span className="text-church-red font-bold">LOVE</span> building Christ-centered relationships that last eternally.
                </p>
                <button className="text-church-blue font-medium px-0 py-2 hover:underline focus:outline-none focus:ring-2 focus:ring-church-blue focus:ring-opacity-50 rounded">
                  Learn more
                </button>
              </div>
            </div>

            {/* Card 3 - Contains "IT" */}
            <div
              className="border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              <ImageWithFallback
                src="https://res.cloudinary.com/dsaqsxtup/image/upload/v1746371305/2149008918_dlptqv.jpg"
                alt="Service"
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">Strong Service</h3>
                <p className="text-gray-600 mb-4">
                  When we serve others, <span className="text-church-red font-bold">IT</span> reflects God's compassion in action.
                </p>
                <button className="text-church-red font-medium px-0 py-2 hover:underline focus:outline-none focus:ring-2 focus:ring-church-red focus:ring-opacity-50 rounded">
                  Learn more
                </button>
              </div>
            </div>

          </div>
        </div>


        {/* Call to Action */}
        <div className="bg-black py-16 sm:py-20 md:py-24 px-4" data-aos="fade-up">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl text-white md:text-4xl font-light mb-12 tracking-wider" data-aos="fade-down">
              WE BELIEVE IN
            </h2>

            <div className="space-y-6 sm:space-y-8 md:space-y-16 lg:space-y-28">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-gray-50 leading-tight overflow-hidden" data-aos="fade-right">
                BIGGER
                <span className="text-church-red">.</span>
              </h1>

              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-9xl font-black text-gray-50 leading-tight sm:pl-4 md:pl-8 lg:pl-20 overflow-hidden" data-aos="fade-left">
                STRONGER
                <span className="text-church-red">.</span>
              </h1>

              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-9xl font-black text-gray-50 leading-tight sm:pl-8 md:pl-16 lg:pl-40 overflow-hidden" data-aos="fade-right">
                FASTER
                <span className="text-church-red">.</span>
              </h1>
            </div>
          </div>
        </div>




        <section className="py-12 sm:py-16 bg-white" data-aos="fade-up">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-10" data-aos="fade-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-black inline-block pb-2">Upcoming Events</h2>
              <Link to="/events" className="text-church-blue font-medium flex flex-shrink-0 items-center hover:text-church-blue/80 transition-colors">
                View All <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {eventsLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  </div>
                ))
              ) : formattedEvents.length > 0 ? (
                formattedEvents.map((event, index) => (
                  <div key={event.id} data-aos="zoom-in" data-aos-delay={index * 100}>
                    <EventCard
                      id={event.id}
                      title={event.title}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                      image={event.image}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No upcoming events at this time.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className="relative py-16 sm:py-24 md:py-32 bg-black overflow-hidden"
          data-aos="fade"
          data-aos-duration="1000"
        >
          {/* Diagonal red slash background - Animated */}
          <div
            className="absolute inset-0 z-0 overflow-hidden"
            data-aos="zoom-out"
            data-aos-duration="1500"
            data-aos-delay="200"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-church-red transform -skew-y-6 origin-top-left opacity-10"></div>
          </div>

          {/* Floating elements with individual animations */}
          <div
            className="hidden md:block absolute top-1/4 right-20 w-16 h-16 rounded-full bg-church-red opacity-20 mix-blend-screen"
            data-aos="fade-left"
            data-aos-delay="800"
            data-aos-duration="1200"
          ></div>
          <div
            className="hidden md:block absolute bottom-1/3 left-10 w-24 h-24 rounded-full bg-church-red opacity-15 mix-blend-screen"
            data-aos="fade-right"
            data-aos-delay="600"
            data-aos-duration="1200"
          ></div>

          {/* Content */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Section header with MASSIVE animated text */}
              <div
                className="mb-20"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <h2
                  className="text-church-red text-4xl sm:text-6xl md:text-8xl lg:text-[120px] xl:text-[180px] 2xl:text-[220px] font-black leading-[0.8] tracking-tighter overflow-hidden"
                  data-aos="fade-right"
                  data-aos-delay="400"
                >
                  TAKE
                </h2>
                <h2
                  className="text-white text-4xl sm:text-6xl md:text-8xl lg:text-[120px] xl:text-[180px] 2xl:text-[220px] font-black leading-[0.8] tracking-tighter -mt-2 sm:-mt-4 md:-mt-8 lg:-mt-16 overflow-hidden"
                  data-aos="fade-left"
                  data-aos-delay="500"
                >
                  IT
                </h2>
              </div>

              {/* Program details - Staggered animations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div>
                  <p
                    className="text-church-red text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6"
                    data-aos="fade-right"
                    data-aos-delay="600"
                  >
                    MONTHLY SPIRITUAL UPLIFTING
                  </p>
                  <p
                    className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight"
                    data-aos="fade-right"
                    data-aos-delay="700"
                  >
                    First Saturday <br />of Every Month
                  </p>
                  <div
                    className="h-2 w-32 bg-church-red mb-8"
                    data-aos="zoom-in-right"
                    data-aos-delay="800"
                  ></div>
                  <p
                    className="text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl max-w-lg"
                    data-aos="fade-up"
                    data-aos-delay="900"
                  >
                    A transformative monthly gathering where we explore fresh spiritual themes,
                    deepen our faith, and equip believers for Kingdom impact.
                  </p>
                </div>

                <div className="space-y-8">
                  <div
                    className="pl-8 border-l-4 border-[#ff0000]"
                    data-aos="flip-up"
                    data-aos-delay="700"
                  >
                    <p className="text-white text-2xl uppercase tracking-widest mb-2">Current Theme</p>
                    <p className="text-church-red text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">"Excellence"</p>
                  </div>

                  <div
                    className="pl-8 border-l-4 border-[#ff0000]"
                    data-aos="flip-up"
                    data-aos-delay="800"
                  >
                    <p className="text-white text-2xl uppercase tracking-widest mb-2">Next Session</p>
                    <p className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">May 3, 2025</p>
                    <p className="text-gray-400 text-xl mt-2">8:00 AM - 11:00 AM</p>
                  </div>

                  {/* CTA Button - Epic entrance */}
                  <div
                    data-aos="zoom-in-up"
                    data-aos-delay="1000"
                    data-aos-anchor-placement="top-bottom"
                  >
                    <button className="mt-8 sm:mt-12 px-8 sm:px-12 md:px-16 py-4 sm:py-6 bg-church-red text-white text-lg sm:text-xl md:text-2xl font-black tracking-wider hover:bg-church-red/80 transition-all transform hover:scale-105 shadow-lg shadow-church-red/30">
                      MARK YOUR CALENDAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <VideoWithFallback
          src="/ydr-2025-teaser.mp4"
          fallbackImage="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
          className="relative flex justify-center items-center py-16 sm:py-24 md:py-32 min-h-screen bg-black overflow-hidden"
          autoPlay
          loop
          muted
          playsInline
          overlayOpacity={0.3}
          data-aos="fade-up"
        >
          {/* Content */}
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center" data-aos="fade-down">
              {/* Subtitle */}
              <div className="text-church-red text-lg md:text-xl font-medium mb-6 tracking-widest" data-aos="fade-right">
                YOUNG DISCIPLE'S RETREAT
              </div>

              {/* Main Title */}
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold text-white mb-8 leading-none tracking-tight overflow-hidden" data-aos="zoom-in">
                YDR 2025
              </h2>

              {/* Tagline */}
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-12 max-w-3xl mx-auto" data-aos="fade-left">
                HOLYGHOST
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-up">
                <button className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white text-lg sm:text-xl font-bold hover:bg-white hover:text-black transition-colors">
                  WATCH HIGHLIGHTS
                </button>
              </div>
            </div>
          </div>

          {/* Scrolling indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" data-aos="fade-up">
            <div className="animate-bounce w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-2 bg-white mt-2 rounded-full"></div>
            </div>
          </div>
        </VideoWithFallback>


        {/* Recent Sermons */}
        <section className="py-16 sm:py-20 md:py-24 bg-white" data-aos="fade-up">
          <div className="container mx-auto px-4">
            {/* Header with dramatic typography */}
            <div className="mb-16 text-center" data-aos="fade-down">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                RECENT SERMONS
              </h2>
              <div className="w-24 h-1 bg-church-red mx-auto"></div>
            </div>

            {/* Sermon list with minimalist design */}
            <div className="max-w-4xl mx-auto space-y-16">
              {sermonsLoading ? (
                // Loading skeleton for sermons
                Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 bg-gray-200 h-64 rounded"></div>
                    <div className="w-full md:w-2/3 space-y-4">
                      <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                      <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                      <div className="bg-gray-200 h-4 rounded w-1/3"></div>
                    </div>
                  </div>
                ))
              ) : formattedSermons.length > 0 ? (
                formattedSermons.map((sermon, index) => (
                  <div key={sermon.id} className="group" data-aos="zoom-in" data-aos-delay={index * 100}>
                    <Link to={`/sermons/${sermon.id}`} className="block">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Image with hover effect */}
                        <div className="w-full md:w-1/3 overflow-hidden">
                          <img
                            src={sermon.image}
                            alt={sermon.title}
                            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Content */}
                        <div className="w-full md:w-2/3">
                          <div className="text-church-red text-sm font-medium mb-2">
                            {sermon.type ? sermon.type.replace('_', ' ').toUpperCase() : 'SERMON'}
                          </div>
                          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                            {sermon.title}
                          </h3>
                          <div className="text-lg sm:text-xl text-gray-600 mb-4">
                            {sermon.speaker}
                          </div>
                          <div className="text-gray-500">
                            {sermon.date}
                          </div>
                          <div className="mt-6">
                            <span className="inline-block border-b-2 border-church-red pb-1 text-church-red font-medium group-hover:border-church-blue group-hover:text-church-blue transition-colors">
                              Listen Now →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-12" data-aos="fade-up">
                  <p className="text-xl text-gray-600 mb-6">Our sermon library is being updated. Check back soon for the latest messages.</p>
                  <Link to="/sermons" className="inline-block text-church-red hover:text-church-red/80 font-medium">
                    Browse All Sermons →
                  </Link>
                </div>
              )}
            </div>

            {/* View All link */}
            <div className="mt-20 text-center" data-aos="fade-up">
              <Link
                to="/sermons"
                className="inline-block text-2xl font-medium text-gray-900 hover:text-church-red transition-colors border-b-2 border-transparent hover:border-church-red pb-1"
              >
                View All Sermons
              </Link>
            </div>
          </div>
        </section>



        <section className="py-16 sm:py-20 md:py-28 bg-white text-gray-900" data-aos="fade-up">
          <div className="container mx-auto px-4 text-center">
            {/* Main Heading - Extra Large */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-tight text-black"
              data-aos="fade-down"
            >
              BECOME A MEMBER
            </h2>

            {/* Subheading - Large */}
            <p
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-16 max-w-4xl mx-auto leading-relaxed"
              data-aos="fade-right"
            >
              Be part of our vibrant family of believers. Worship with us this Sunday!
            </p>

            {/* Buttons - Extra Large */}
            <div
              className="flex flex-col sm:flex-row justify-center gap-6"
              data-aos="fade-up"
            >
              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg sm:text-xl md:text-2xl border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 sm:px-12 py-4 sm:py-6"
                >
                  LEARN MORE
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-church-red hover:bg-church-red/90 text-white text-lg sm:text-xl md:text-2xl px-8 sm:px-12 py-4 sm:py-6"
                >
                  CONTACT US
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
