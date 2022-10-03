import React from "react"
import invariant from 'tiny-invariant';

type inputProps = {
    amount?: number,
    coin?: string,
    setAmount?: (amount: number) => void
}



export default function SwapInput ({amount,coin,setAmount}:inputProps) {


    const setValidAmount = (e : React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        invariant(target instanceof HTMLInputElement, "target is not an input element");
        const value = target.value;
        const parsedValue = parseFloat(value);

        if (setAmount)
            setAmount(parsedValue);
    }

    return (
        <div className="bg-white border-2 w-1/3 ">
        <label className="flex flex-col px-2">
            {coin}
            <input   name="amount" type="number" min={0} value={amount ?? "0.0"} onChange={setValidAmount}/>
        </label>
    </div>

    )
    }