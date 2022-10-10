import { Form, Outlet } from "@remix-run/react";
import { useRef, useState } from "react";
import SwapInput from "~/components/SwapInput";

export default function Swap() {

  const defaultSwap = ["Bilira","Sucoin"]

    const [reverse,setReverse]= useState(false);

    const [firstCoin,secondCoin] = reverse ? defaultSwap.reverse() : defaultSwap

    const [amount,setAmount] = useState(0);

    return (
  
      <div className='swap-page px-8 py-4 h-full'>
        <p className="font-semibold text-lg">Swap Token</p>

        <form className="flex flex-col justify-center items-center space-y-4 mt-10">

            <input hidden name="reverse" readOnly value={reverse.toString()}/>


   
            <SwapInput amount={amount} coin={firstCoin} setAmount={setAmount} />

         

            <svg onClick={() => setReverse(!reverse)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 bg-black text-white cursor-pointer">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>



            <SwapInput amount={amount} coin={secondCoin} setAmount={setAmount}/>



   

            <button className="bg-black text-white w-1/3">
                Swap
            </button>



        </form>



      
      </div>
       
    )
  }