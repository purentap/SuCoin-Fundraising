import AuctionList from '~/components/AuctionList';
import HowTo from '~/components/HowTo';
import ProjectList from '~/components/ProjectList';
import About from '../components/About'

export default function Index() {
  return (
    <div className="p-10">
      <p className="font-semibold text-lg">Welcome SULaunch</p>
      <ProjectList/>
      <AuctionList/>
      <HowTo/>
      <About/>
    </div>
  );
}
