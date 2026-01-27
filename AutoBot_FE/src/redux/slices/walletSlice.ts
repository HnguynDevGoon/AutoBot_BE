// redux/slices/walletSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  balance: number;
}

const initialState: WalletState = {
  balance: 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    deductBalance: (state, action: PayloadAction<number>) => {
      state.balance -= action.payload;
    }
  },
});

export const { setBalance, deductBalance } = walletSlice.actions;
export default walletSlice.reducer;