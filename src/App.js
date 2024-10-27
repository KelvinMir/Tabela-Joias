import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, } from "firebase/firestore";
import './css/App.css';
import { db } from './firebase';
   
import TotalToReceive from './totaltoreceive';
import Table from './table';

function App() {
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState({
    buyerName: '',
    valueSold: '',
    installments: '',
    firstPaymentMonth: '',
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
        const date = data.date && typeof data.date.toDate === 'function' 
                ? data.date.toDate() 
                : new Date(data.date); 
                return {
                  id: doc.id,
                  ...data,
                  date, // Usa a data convertida
              };
      });
      setSales(salesData);
    } catch (error) {
    
    }
  };
  
    //Função para recolher vendas parceladas
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (saleId) => {
    
    setExpandedRows(prevExpandedRows => ({
        ...prevExpandedRows,
        [saleId]: !prevExpandedRows[saleId]
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
        buyerName: formData.buyerName, 
        date: new Date(),  
        valueSold: parseFloat(formData.valueSold),
        installments: parseInt(formData.installments),
        firstPaymentMonth: formData.firstPaymentMonth,
        installmentValues: Array(parseInt(formData.installments)).fill(
          parseFloat(formData.valueSold) / parseInt(formData.installments)
        ),         
        isPaid: false
      };
        
      if (formData.id) {
        // Atualizar venda existente
        setSales(sales.map((sale) => (sale.id === formData.id ? { ...sale, ...newSale } : sale)));
      } else {
        // Criar nova venda
        const docRef = await addDoc(collection(db, "sales"), newSale);
        setSales([...sales, { ...newSale, id: docRef.id }]);
      }
      setFormData({ buyerName: '', valueSold: '', installments: '', costValue: '', firstPaymentMonth: '' });
      
    } catch (error) {
      // Tratamento de erro
      console.error('Erro ao registrar a venda', error);
    }
    
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
      <Table 
        sales={sales} 
        setSales={setSales} 
        expandedRows={expandedRows} // Passa o estado expandedRows
        toggleRow={toggleRow} // Passa a função toggleRow
      />
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
      <TotalToReceive sales={sales} currentMonth={currentMonth} currentYear={currentYear} />
      
    </div>
  );
}

export default App;
