import React from "react";
import invariant from "tiny-invariant";


type Props = {
    title : string,
}



export default function DropdownFile ({title} : Props) {


    const [imageSource, setImageSource] = React.useState<string | undefined>(undefined);

    const handleFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const files = target.files;
        invariant(files, "files is null");
        const file = files[0];
        setImageSource(URL.createObjectURL(file));
    }

    console.log(imageSource);

  return (
    <div className="border-2 w-full min-h-[200px] flex flex-col">

    <label className="text-center flex flex-col h-full items-center relative">
    
        <p className="text-sm">{title}</p>


            {imageSource ? <embed className="h-full w-full" src={imageSource}/>  : 
    
            <div className="bottom-1/2 absolute">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
            </div>

            

    }

  




    
        <input required type="file" onChange={handleFileChange} className="w-full hidden" />
    
    
    </label>
    
    
    </div>
    
  )
}