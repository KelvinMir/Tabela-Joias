import React, { useEffect, useState, useCallback } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import Lixeira from '../src/assets/lixeira.svg';
import ArrowCima from '../src/assets/icons8-divisa-circulada-acima-50.png';
import ArrowBaixo from '../src/assets/icons8-divisa-circulada-abaixo-50.png';
import './css/table.css';
import Engrenagem from '../src/assets/icons8-engrenagem-50.png';

function Table({ sales, setSales, expandedRows, toggleRow, firstPaymentMonth, currentYear,currentMonth, parsedAmountPaid, setTotalToReceiveT,totalToReceiveT}) {
    const [paidSales, setPaidSales] = useState([]);

    // Atualiza o Firestore com as parcelas e estado de pagamento da venda
    const updateFirestore = async (saleId, updatedInstallments, isPaid) => {
        try {
            await updateDoc(doc(db, 'sales', saleId), {
                installmentValues: updatedInstallments,
                isPaid
            });
        } catch (error) {
            console.error('Erro ao atualizar documento no Firestore:', error);
        }
    };
    

    // Gerencia o pagamento da parcela
    
    // Alterna o status de pagamento da parcela
    const handleInstallmentPaid = (saleId, installmentIndex) => {
        const updatedSales = sales.map((sale) => {
            if (sale.id === saleId) {
                const updatedInstallments = sale.installmentValues.map((installment, idx) => {
                    if (idx === installmentIndex) {
                        const isPaid = !installment.isPaid;
                        return { ...installment, isPaid };
                    }
                    return installment;
                });
                updateFirestore(saleId, updatedInstallments, updatedInstallments.every((i) => i.isPaid));
                return { ...sale, installmentValues: updatedInstallments };
            }
            return sale;
        });
        setSales(updatedSales);
    };

    // Desmarca todas as parcelas de uma venda como "não pagas"
    const unmarkAllInstallments = async (saleId) => {
        const updatedSales = await Promise.all(
            sales.map(async (sale) => {
                if (sale.id === saleId) {
                    const updatedInstallments = sale.installmentValues.map((installment) => ({
                        ...installment,
                        isPaid: false,
                        paidAmount: 0,
                        remainingValue: Number(installment.value)
                    }));

                    await updateFirestore(saleId, updatedInstallments, false);
                    return { ...sale, installmentValues: updatedInstallments };
                }
                return sale;
            })
        );
        setSales(updatedSales);
    };

    const getPaidSales = useCallback(
        () => sales.filter((sale) => sale.installmentValues.every((installment) => installment.isPaid)),
        [sales]
    );

    const getPendingSales = () => sales.filter((sale) => !sale.installmentValues.every((installment) => installment.isPaid));


    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
            await deleteDoc(doc(db, 'sales', id));
            setSales(sales.filter((sale) => sale.id !== id));
        }
    };

    useEffect(() => {
        setPaidSales(getPaidSales());
    }, [sales, getPaidSales]);

    return (
        <div className="Tables">
            <div className="TPendentes">
                <h2>Vendas Registradas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Comprador</th>
                            <th>Valor Vendido</th>
                            <th>Parcelas</th>
                            <th><img src={Engrenagem} alt='Opções'style={{ width: '30px', height: '30px'}}/></th>
                        </tr>
                    </thead>
                    <tbody>
                        {getPendingSales().map((sale) => (
                            <React.Fragment key={sale.id}>
                                <tr>
                                    <td data-label="Data">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td data-label="Comprador" className='Comprador'>{sale.buyerName}</td>
                                    <td data-label="Valor Vendido">R${sale.valueSold.toFixed(2)}</td>
                                    <td data-label="Parcelas">{sale.installmentValues.length} Parcelas</td>
                                    <td data-label="Detalhar"className='Tdicons'>
                                        <div className='TdDetalhar'>
                                            <button className='BotãoExcluir' onClick={() => handleDelete(sale.id)}>
                                                <img src={Lixeira} alt="Excluir" />
                                            </button>
                                            <button onClick={() => toggleRow(sale.id)}>
                                                <img  className='icons' src={expandedRows[sale.id] ? ArrowCima : ArrowBaixo} alt="Expandir" />
                                            </button>
                                        </div>
                                        
                                    </td>
                                </tr>
                                {expandedRows[sale.id] && (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="accordion-content">
                                                {sale.installmentValues.map((installment, index) => (
                                                    <div key={index} className="accordion-item">
                                                        <label>Parcela {index + 1}:</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={installment.isPaid}
                                                            onChange={() =>
                                                                handleInstallmentPaid(sale.id, index)
                                                            }
                                                        />
                                                        {installment.isPaid ? '(Pago)' : ''}
                                                        
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

            </div>
            <div className="TPagas">
                <h2>Vendas Pagas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Comprador</th>
                            <th>Valor Vendido</th>
                            <th>Parcelas</th>
                            <th><img src={Engrenagem} alt='Opções'style={{ width: '30px', height: '30px'}}/></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paidSales.map((sale) => (
                            <tr key={sale.id}>
                                <td data-label="Data">{new Date(sale.date).toLocaleDateString()}</td>
                                <td data-label="Comprador"className='Comprador'>{sale.buyerName}</td>
                                <td data-label="Valor Vendido">R${sale.valueSold.toFixed(2)}</td>
                                <td data-label="Parcelas">
                                    <div>{sale.installmentValues.length} Parcelas</div>
                                </td>
                                <td><button onClick={() => unmarkAllInstallments(sale.id)}>Marcar como Pendente</button></td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
        </div>
    );
}

export default Table;
