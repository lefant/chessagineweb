import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import UserLichessGames from "./UserLichessGames";
import UserChessComGames from "../chesscom/UserChessComGames";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";


interface UserGameSelectProps {
  loadPGN: (pgn: string) => void;
  provider?: "Lichess" | "Chess.com";
}

const UserGameSelect: React.FC<UserGameSelectProps> = ({ loadPGN, provider = "Lichess" }) => {
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
 
  return (
    <>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleOpen}
          startIcon={<SportsEsportsIcon />}
          sx={{
           
            py: 1.5,
            fontWeight: 'medium',
          }}
        >
          Select {provider} Game
        </Button>
      </Stack>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              
              padding: 2,
              borderRadius: 2,
          
            },
          },
        }}
      >
        <DialogTitle 
          sx={{ 
      
            textAlign: 'center',
            fontWeight: 'bold',
            pb: 2,
            mb: 2,
          }}
        >
          Select a Recent {provider} Game
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {provider === "Chess.com" ? (
            <UserChessComGames loadPGN={loadPGN} setOpen={setOpen} />
          ) : (
            <UserLichessGames loadPGN={loadPGN} setOpen={setOpen} />
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            pt: 2,
   
            justifyContent: 'center',
          }}
        >
          <Button 
            onClick={handleClose} 
            variant="outlined"
            sx={{ 
            
              minWidth: 100,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserGameSelect;
