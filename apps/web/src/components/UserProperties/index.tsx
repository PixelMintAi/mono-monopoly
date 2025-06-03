import { Player } from '@/types/game'
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '../ui/button';

interface UserPropertiesProps {
  players: Player[]
  currentPlayerIndex: number;
  sellProperty:any
  mortageProperty:any
  getBackMortagedProperty:any
}

const UserProperties = ({ players, currentPlayerIndex,sellProperty,mortageProperty,getBackMortagedProperty }: UserPropertiesProps) => {
  // Guard clause for invalid states
  if (!players?.length) {
    return (
      <Card className="ml-6 mr-4 p-2 bg-destructive/10">
        <CardContent className="p-2 text-destructive">
          No players available
        </CardContent>
      </Card>
    )
  }

  // Validate currentPlayerIndex
  if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
    return (
      <Card className="ml-6 mr-4 p-2 bg-destructive/10">
        <CardContent className="p-2 text-destructive">
          Invalid player selected
        </CardContent>
      </Card>
    )
  }

  const currentPlayer = players[currentPlayerIndex]
  const propertyCount = currentPlayer.properties?.length ?? 0

  return (
    <Card className="flex flex-col ml-6 mr-4 p-2 bg-fuchsia-950">
      <CardContent className="p-2">
        <div className='w-full text-center mb-4'>
          My Properties ({propertyCount})
        </div>
        <div className='mb-4'>
          {currentPlayer.properties?.map((property, index) => (
            <div className='p-2 flex w-full justify-between' key={`${property.name}-${index}`}>
              {property.name}
              <div className='flex gap-[1rem]'>
                {!property.isMortgaged ?<Button className='cursor-pointer' onClick={()=>{
                  mortageProperty(property.id)
                }}>
                  Mortage
                </Button>:<Button className='cursor-pointer' onClick={()=>{
                  getBackMortagedProperty(property.id)
                }}>
                  Remove Mortage
                </Button>}
                <Button className='cursor-pointer' onClick={()=>{
                  sellProperty(property.id)
                }}>
                  Sell
                </Button>
              </div>
            </div>
          )) ?? (
            <div className="text-center text-muted-foreground">No properties owned</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default UserProperties