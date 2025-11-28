using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Converters
{
    public class Converter_WalletTransaction
    {
        public DTO_WalletTransaction EntityToDTO(WalletTransaction walletTransaction)
        {
            return new DTO_WalletTransaction
            {
                Id = walletTransaction.Id,
                Amount = walletTransaction.Amount,
                Description = walletTransaction.Description,
                OrderCode = walletTransaction.OrderCode,
                Timestamp = walletTransaction.Timestamp,
                TransactionStatus = walletTransaction.TransactionStatus,
                TransactionType = walletTransaction.TransactionType,
                UserId = walletTransaction.Wallet != null ? walletTransaction.Wallet.UserId : Guid.Empty,
            };
        }
    }
}
