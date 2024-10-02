import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import './App.css';
import { db } from './firebase';
import Lixeira from './assets/lixeira.svg'     
import ArrowCima from './assets/icons8-divisa-circulada-acima-50.png' 
import ArrowBaixo from './assets/icons8-divisa-circulada-abaixo-50.png'    

function App() {
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState({
    buyerName: '',
    valueSold: '',
    installments: '',
    costValue: '',
    firstPaymentDate: '',
    isPaid: false
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); 
  
  //Função para mudar o mês dos valores a receber
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    if (newMonth > 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else if (newMonth < 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

   // Função para carregar as vendas salvas
  const loadSales = async () => {
    try {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const salesData = salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date ? data.date.toDate() : null // Converte o Timestamp para Date, se existir
        };
      });
      setSales(salesData);
    } catch (error) {
      console.log("Erro ao carregar as vendas:", error);
    }
  };
  //Função para recolher vendas parceladas
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (saleId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [saleId]: !prev[saleId], // Alterna o estado de expansão da linha
    }));
  };
  
  useEffect(() => {
    loadSales();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  // Função para enviar dados para o banco
  const handleSubmit =  async (e) => {
    e.preventDefault();

    if (!formData.buyerName || !formData.valueSold || !formData.installments ||!formData.firstPaymentMonth) {
      alert("Preencha todos os campos antes de enviar.");  // Feedback ao usuário
      return;
    }
    try {
      const newSale = {
        date: new Date(),  
        buyerName: formData.buyerName, 
        valueSold: parseFloat(formData.valueSold),
        installments: parseInt(formData.installments),
        //costValue: parseFloat(formData.costValue),
        firstPaymentDate: new Date(formData.firstPaymentDate),
        installmentValues: Array(parseInt(formData.installments)).fill(
          parseFloat(formData.valueSold) / parseInt(formData.installments)), 
        isPaid: false
      };
        
      if (formData.id) {
        // Atualizar venda existente
        await handleEdit(formData.id, newSale);
        setSales(sales.map((sale) => (sale.id === formData.id ? { ...sale, ...newSale } : sale)));
      } else {
        // Criar nova venda
        const docRef = await addDoc(collection(db, "sales"), newSale);
        setSales([...sales, { ...newSale, id: docRef.id }]);
      }
      setFormData({ buyerName: '', valueSold: '', installments: '', costValue: '', firstPaymentMonth: '' });
      console.log("Venda registrada com sucesso!");
    } catch (error) {
      // Tratamento de erro
      console.error('Erro ao registrar a venda', error);
    }
    
  };


  // Função para excluir uma venda
  const handleDelete = async (id) => {
    try {
      if (!id) {
        throw new Error("ID indefinido");
      }
      const confirmDelete = window.confirm("Tem certeza que deseja excluir esta venda?");
      if (!confirmDelete) return;
  
      await deleteDoc(doc(db, "sales", id));  // Exclui a venda do Firestore
      setSales(sales.filter((sale) => sale.id !== id));  // Remove a venda do estado local
      console.log("Venda excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar documento: ", error);
    }
  };
  


  // Função para editar uma venda
  const handleEdit = async (id, updatedData) => {
    try {
      console.log("ID recebido para edição:", id);
      console.log("Dados a serem atualizados:", updatedData);
      if (!id) {
        throw new Error("ID indefinido");
      }
      if (!updatedData || typeof updatedData !== 'object') {
        throw new Error("Os dados atualizados estão indefinidos ou no formato incorreto.");
      }
      await updateDoc(doc(db, "sales", id), updatedData);
      
      setSales(sales.map((sale) => (sale.id === id ? { ...sale, ...updatedData } : sale)));
      console.log("Venda atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao editar documento: ", error);
    }
  };
  
  

  // Função para mapear parcelas
  const handleInstallmentPaid = (saleId, installmentIndex) => {
    const updatedSales = sales.map((sale) => {
      if (sale.id === saleId) {
        const updatedInstallments = sale.installmentValues.map((installment, index) => {
          if (index === installmentIndex) {
            return {
              ...installment,
              isPaid: !installment.isPaid,
            };
          }
          return installment;
        });
      
        return { ...sale, installmentValues: updatedInstallments};
      }
      return sale; 
    });
    setSales(updatedSales); 
    const updatedSaleData = updatedSales.find(sale => sale.id === saleId);
    handleEdit(saleId, updatedSaleData);
  };

    // Função para mapear vendas/parcelas pagas
    const getPaidSales = () => {
      return sales.filter(sale => sale.installmentValues.every(installment => installment.isPaid));
    };
     // Função para obter vendas pendentes
     const getPendingSales = () => {
      return sales.filter(sale => !sale.installmentValues.every(installment => installment.isPaid));
    };
    const paidSales = getPaidSales();
    const pendingSales = getPendingSales();  


     // Função para desmarcar todas as parcelas de uma venda
    const unmarkAllInstallments = async (saleId) => {
      try {
        const updatedSales = sales.map((sale) => {
          if (sale.id === saleId) {
            // Desmarca todas as parcelas como "não pagas"
            const updatedInstallments = sale.installmentValues.map((installment) => ({
              ...installment,
              isPaid: false,
            }));
            const updatedSale = { ...sale, installmentValues: updatedInstallments };

            // Atualiza o Firestore com as parcelas não pagas
            updateDoc(doc(db, "sales", sale.id), updatedSale);

            return updatedSale; // Atualiza a venda com parcelas não pagas
          }
          return sale;
        });
        
        setSales(updatedSales); // Atualiza o estado local
      } catch (error) {
        console.error("Erro ao atualizar parcelas:", error);
      }
    };


  // Calcula o total a receber no mês atual
  const getTotalToReceive = () => {
    return sales.reduce((total, sale) => {
      return total + sale.installmentValues.reduce((subtotal, installmentValue, index) => {
        const saleMonth = new Date(sale.date).getMonth() + 1; // Mês da venda
        const saleYear = new Date(sale.date).getFullYear(); // Ano da venda
        const installmentMonth = saleMonth + index;
        const installmentYear = saleYear + Math.floor((installmentMonth - 1) / 12); // Corrigido para considerar meses
        const adjustedInstallmentMonth = ((installmentMonth - 1) % 12) + 1; // Ajusta o mês caso seja maior que 12
  
        // Verifique se installmentValue é um número
        const value = parseFloat(installmentValue); // Converte para número
        if (isNaN(value)) {
          console.warn(`Valor da parcela não é um número: ${installmentValue}`);
          return subtotal; 
        }
  
        // Condição para somar
        if (adjustedInstallmentMonth === currentMonth && installmentYear === currentYear) {
          return subtotal + value; // Somar valor
        }
  
        return subtotal;
      }, 0);
    }, 0);
  };
  
  
  
  

  return (
    <div className="App">
      <div className='Left'>
        <h1>Registro de Vendas</h1>
        <form className='Formulario1' onSubmit={handleSubmit}>
          <div>
            <label htmlFor="buyer-name">Comprador:</label>
            <input
              type="text"
              id="buyer-name"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleInputChange}
              placeholder="Digite o nome do comprador"
            />
          </div>
          <div>
            <label>Valor:</label>
            <input
              type="number"
              name="valueSold"
              value={formData.valueSold}
              onChange={handleInputChange}
              placeholder="Digite o valor da venda"
              required
            />
          </div>
          <div>
            <label>Parcelas:</label>
            <input
              type="number"
              name="installments"
              value={formData.installments}
              onChange={handleInputChange}
              placeholder="Digite o número de parcelas da venda"
              required
            />
          </div>
          {/*<div>
            <label>Valor de Custo:</label>
            <input
              type="number"
              name="costValue"
              value={formData.costValue}
              onChange={handleInputChange}
              required
            />
          </div> DESATIVADO */}
         <div>
          <label htmlFor="first-payment-month">Mês do Primeiro Pagamento:</label>
          <input
            type="month"
            id="first-payment-month"
            name="firstPaymentMonth"
            value={formData.firstPaymentMonth || ''}
            onChange={handleInputChange}
          />
        </div>

          <button type="submit">Registrar Venda</button>
        </form>
      </div>
      <div className='Tables'>
        <div className='TPendentes'>
          <h2>Vendas Registradas</h2>
          <table>
            <thead>
              <tr>
                <th data-label="Data">Data</th>
                <th data-label="Comprador">Comprador</th>
                <th data-label="Valor Vendido">Valor Vendido</th>
                <th data-label="Parcelas">Parcelas</th>
                <th>Detalhar</th>
                {/*<th data-label="Valor de Custo">Valor de Custo</th> DESATIVADO*/}
              </tr>
            </thead>
            <tbody>
            {pendingSales.map((sale, saleIndex) => {
                const saleDate = new Date(sale.date);
                return (
                  <React.Fragment key={sale.id || saleIndex}>
                    <tr key={sale.id || saleIndex}>
                      <td data-label="Data">{isNaN(saleDate) ? "Data inválida" : saleDate.toLocaleDateString()}</td>
                      <td data-label="Comprador" className='Comprador'>{sale.buyerName}</td>
                      <td data-label="Valor Vendido">R${sale.valueSold.toFixed(2)}</td>
                      <td>
                          {sale.installmentValues.length} Parcelas
                      </td>
                      {/* <td data-label="Valor de Custo">R${sale.costValue.toFixed(2)}</td> DESATIVADO */}
                      <td className='Tdicons'>
                        <div className='TdDetalhar'>
                          {/*<button className='BotãoEditar' onClick={() => handleEdit(sale.id)}>Editar</button>*/}
                          <button className='BotãoExcluir'onClick={() => handleDelete(sale.id)}><img src={Lixeira} alt='Excluir'/></button>
                          <button onClick={() => toggleRow(sale.id)}>
                            <img
                              src={expandedRows[sale.id] ? ArrowCima : ArrowBaixo}
                              alt={expandedRows[sale.id] ? "Minimizar" : "Expandir"}
                              className='icons'
                            />

                          </button>
                        </div>
                      </td>
                  </tr>
                  
                  {expandedRows[sale.id] && (
                      <tr>
                        <td colSpan="6">
                          <div className="accordion-content">
                            {sale.installmentValues.map((installmentValue, installmentIndex) => {
                              const value = parseFloat(installmentValue);
                              if (isNaN(value)) {
                                console.warn(`Valor da parcela não é um número: ${installmentValue}`);
                                return null; // Não renderiza se não for um número
                              }

                              return (
                                <div key={installmentIndex} className="accordion-item">
                                  <label>Parcela {installmentIndex + 1}: </label>
                                  R${value.toFixed(2)}
                                  <input
                                    type="checkbox"
                                    checked={sale.installmentValues[installmentIndex].isPaid || false} // Verifique o estado correto de pagamento
                                    onChange={() => handleInstallmentPaid(sale.id, installmentIndex)}
                                  />
                                  {sale.installmentValues[installmentIndex].isPaid ? '(Pago)' : '(Pendente)'}
                                </div>
                              );
                            })}


                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>

          </table>
        </div>
        <div className='TPagas'>
          <h2>Vendas Pagas</h2>
          <table>
            <thead>
              <tr>
                <th data-label="Data">Data</th>
                <th data-label="Comprador">Comprador</th>
                <th data-label="Valor Vendido">Valor Vendido</th>
                <th data-label="Parcelas">Parcelas</th>
              </tr>
            </thead>
            <tbody>
              {paidSales.map((sale, saleIndex) => (
                <tr key={sale.id || saleIndex}>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td className='Comprador'>{sale.buyerName}</td>
                  <td>R${sale.valueSold.toFixed(2)}</td>
                  <td>{sale.installmentValues.length} Parcelas</td>
                  <td>
                    {/* Botão para mover para pendentes */}
                    <button onClick={() => unmarkAllInstallments(sale.id)}>
                      Marcar como Pendente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2>Valores a Receber no Mês</h2>
      <div>
        <label>Mês:</label>
        <input
          type="number"
          value={currentMonth}
          onChange={handleMonthChange}
        />
        <label>Ano:</label>
        <input
          type="number"
          value={currentYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
        />
      </div>
      <h3 className='Footer'>Total a Receber: R${getTotalToReceive().toFixed(2)}</h3>
    </div>
  );
}

export default App;
