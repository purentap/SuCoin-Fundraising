
import howtouse from '../images/howtouse.svg'

export default function HowTo () {
  return (
    <div className="p-10 flex  flex-col items-center space-y-2">
      <p className="font-semibold text-lg">How To Use SULaunch</p>
      <img src={howtouse} alt="How To Use SULaunch" />
   

    </div>
  )
}