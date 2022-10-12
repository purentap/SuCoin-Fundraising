import { Form, Outlet } from "@remix-run/react";
import { useRef, useState } from "react";
import DropdownFile from "~/components/DropdownFile";
import SwapInput from "~/components/SwapInput";

export default function Apply() {



    return (

  
      <div className='swap-page px-8 py-4  bg-custom-gray flex-grow'>
        <p className="font-semibold text-lg">Apply For Project</p>

        <form className="flex flex-col justify-center items-center space-y-4 mt-10 w-full">

            <label className="flex items-center flex-col w-full">

                <p className="text-sm">Project Name</p>
                <input required type="text" className="border-2 w-1/3" />


            </label>

            <label className="flex items-center flex-col w-full">

                    <p className="text-sm">Project Description</p>
                    <textarea required rows={5} className="border-2 w-1/3" />


            </label>

            
            <div className="flex space-x-2 w-1/3">

                <DropdownFile title={"Whitepaper"}/>

                <DropdownFile title={"Image"}/>
                

            </div>


            <div className="flex space-x-2 w-1/3 justify-between">


                <button className="bg-blue-500 text-white rounded-sm w-full">
                    Submit to Blockchain
                </button>


                <button className="bg-custom-green text-white rounded-sm w-full">
                    Submit to Database
                </button>


            </div>


            

        



        </form>



      
      </div>

       
    )
  }