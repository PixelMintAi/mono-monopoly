import { Player } from '@/types/game'
import React from 'react'

const UserProperties = ({players,currentPlayerIndex}:{players:Player[],currentPlayerIndex:number}) => {
  return (
    <div className="flex flex-col ml-6 mr-4 p-2 bg-fuchsia-950 rounded">
      <div className='w-full text-center mb-4'>
        My Properties ({players[currentPlayerIndex].properties.length})
      </div>
      <div className='mb-4'>
        {
          players[currentPlayerIndex].properties.map((property,index:number)=>(
            <div className='p-2' key={index}>
              {property.name}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default UserProperties