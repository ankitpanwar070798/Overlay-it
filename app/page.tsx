import FeaturesSection from "./components/Features";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import ImageComparision from "./components/ImageComparision";
import Navbar from "./components/Navbar";
import Overlayit from "./components/Overlayit";




export default function Home() {
  return (
    <main className="overflow-hidden">
    <Navbar/>
    <HeroSection/>
    <FeaturesSection/>
    <ImageComparision/>
    <Overlayit/>
    <Footer/>
    </main>
  );
}
