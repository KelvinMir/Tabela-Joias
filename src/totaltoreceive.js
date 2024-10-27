import React from 'react';
import "./css/totaltoreceive.css";

function TotalToReceive({ sales, currentMonth, currentYear }) {
    // Função para calcular o total a receber no mês atual
    const getTotalToReceive = () => {
        return sales.reduce((total, sale) => {
            if (!sale.firstPaymentMonth || !/^\d{2}\/\d{4}$/.test(sale.firstPaymentMonth)) {
                console.warn('Formato inválido para firstPaymentMonth:', sale.firstPaymentMonth);
                return total;
            }

            // Converte "MM/AAAA" para números
            const [saleMonth, saleYear] = sale.firstPaymentMonth.split('/').map(Number);

            return total + sale.installmentValues.reduce((subtotal, installmentValue, index) => {
                if (sale.paidInstallments && sale.paidInstallments.includes(index)) {
                    return subtotal; // Ignora parcelas pagas
                }

                // Verifica se installmentValue é um número válido
                const value = parseFloat(installmentValue);
                if (isNaN(value)) {
                    console.warn(`Valor da parcela não é um número: ${installmentValue}`);
                    return subtotal; // Ignora se não for um número
                }

                const installmentMonth = (saleMonth + index - 1) % 12 + 1;
                const installmentYear = saleYear + Math.floor((saleMonth + index - 1) / 12);

                if (installmentMonth === currentMonth && installmentYear === currentYear) {
                    return subtotal + value; // Soma apenas se for do mês atual
                }

                return subtotal;
            }, 0);
        }, 0);
    };

    const totalToReceive = getTotalToReceive();

    return (
        <h3 className='Footer'>
            Total a Receber: R${totalToReceive.toFixed(2)}
        </h3>
    );
}

export default TotalToReceive;
