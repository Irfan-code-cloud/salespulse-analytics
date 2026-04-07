export interface Order {
  id?: string;
  orderNumber: string;
  product: string;
  price: number;
  date: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  status: string;
}

export const CITIES = [
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 }
];

export const RAW_DATA = `Order Number,Product,Price,Date
TT-1001,Slim-Fit Denim Jeans,$88.00,2025-08-15
TT-1001,Technical Performance Joggers,$75.00,2025-08-15
TT-1002,Classic Fit Chinos,$78.00,2025-08-15
TT-1003,Flannel-Lined Canvas Work Pants,$98.00,2025-08-16
TT-1004,Double-Pleated Khaki Trousers,$82.00,2025-08-16
TT-1005,Relaxed Fit Corduroy Trousers,$85.00,2025-08-17
TT-1005,Multi-Pocket Cargo Shorts,$58.00,2025-08-17
TT-1006,Premium Tailored Trousers,$175.00,2025-08-18
TT-1007,Classic Denim Overalls,$115.00,2025-08-18
TT-1008,Drawstring Linen Trousers,$92.00,2025-08-19
TT-1009,Slim-Fit Denim Jeans,$88.00,2025-08-19
TT-1009,Classic Fit Chinos,$78.00,2025-08-19
TT-1010,Tailored Wool Dress Trousers,$145.00,2025-08-20
TT-1011,Technical Performance Joggers,$75.00,2025-08-20
TT-1012,Multi-Pocket Cargo Shorts,$58.00,2025-08-21
TT-1013,Striped Seersucker Trousers,$95.00,2025-08-21
TT-1014,Slim-Fit Denim Jeans,$88.00,2025-08-22
TT-1015,Flannel-Lined Canvas Work Pants,$98.00,2025-08-22
TT-1015,Classic Fit Chinos,$78.00,2025-08-22
TT-1016,Drawstring Linen Trousers,$92.00,2025-08-23
TT-1017,Premium Tailored Trousers,$175.00,2025-08-24
TT-1018,Double-Pleated Khaki Trousers,$82.00,2025-08-24
TT-1018,Relaxed Fit Corduroy Trousers,$85.00,2025-08-24
TT-1019,Technical Performance Joggers,$75.00,2025-08-25
TT-1020,Classic Denim Overalls,$115.00,2025-08-25
TT-1021,Multi-Pocket Cargo Shorts,$58.00,2025-08-26
TT-1022,Classic Fit Chinos,$78.00,2025-08-26
TT-1023,Slim-Fit Denim Jeans,$88.00,2025-08-27
TT-1024,Tailored Wool Dress Trousers,$145.00,2025-08-27
TT-1025,Flannel-Lined Canvas Work Pants,$98.00,2025-08-28
TT-1025,Multi-Pocket Cargo Shorts,$58.00,2025-08-28
TT-1026,Drawstring Linen Trousers,$92.00,2025-08-29
TT-1027,Striped Seersucker Trousers,$95.00,2025-08-29
TT-1028,Relaxed Fit Corduroy Trousers,$85.00,2025-08-30
TT-1029,Premium Tailored Trousers,$175.00,2025-08-30
TT-1029,Classic Fit Chinos,$78.00,2025-08-30
TT-1030,Technical Performance Joggers,$75.00,2025-08-31
TT-1031,Slim-Fit Denim Jeans,$88.00,2025-09-01
TT-1032,Double-Pleated Khaki Trousers,$82.00,2025-09-01
TT-1033,Classic Denim Overalls,$115.00,2025-09-02
TT-1034,Flannel-Lined Canvas Work Pants,$98.00,2025-09-02
TT-1034,Classic Fit Chinos,$78.00,2025-09-02
TT-1035,Multi-Pocket Cargo Shorts,$58.00,2025-09-03
TT-1036,Drawstring Linen Trousers,$92.00,2025-09-03
TT-1037,Tailored Wool Dress Trousers,$145.00,2025-09-04
TT-1038,Striped Seersucker Trousers,$95.00,2025-09-04
TT-1039,Technical Performance Joggers,$75.00,2025-09-05
TT-1040,Slim-Fit Denim Jeans,$88.00,2025-09-05
TT-1040,Relaxed Fit Corduroy Trousers,$85.00,2025-09-05
TT-1041,Classic Fit Chinos,$78.00,2025-09-06
TT-1042,Premium Tailored Trousers,$175.00,2025-09-06
TT-1043,Flannel-Lined Canvas Work Pants,$98.00,2025-09-07
TT-1044,Double-Pleated Khaki Trousers,$82.00,2025-09-08
TT-1045,Multi-Pocket Cargo Shorts,$58.00,2025-09-08
TT-1046,Classic Denim Overalls,$115.00,2025-09-09
TT-1047,Tailored Wool Dress Trousers,$145.00,2025-09-09
TT-1047,Classic Fit Chinos,$78.00,2025-09-09
TT-1048,Drawstring Linen Trousers,$92.00,2025-09-10
TT-1049,Slim-Fit Denim Jeans,$88.00,2025-09-10
TT-1050,Technical Performance Joggers,$75.00,2025-09-11
TT-1051,Striped Seersucker Trousers,$95.00,2025-09-12
TT-1052,Relaxed Fit Corduroy Trousers,$85.00,2025-09-12
TT-1053,Premium Tailored Trousers,$175.00,2025-09-13
TT-1054,Flannel-Lined Canvas Work Pants,$98.00,2025-09-13
TT-1054,Multi-Pocket Cargo Shorts,$58.00,2025-09-13
TT-1055,Double-Pleated Khaki Trousers,$82.00,2025-09-14
TT-1056,Classic Fit Chinos,$78.00,2025-09-14
TT-1057,Slim-Fit Denim Jeans,$88.00,2025-09-15
TT-1058,Classic Denim Overalls,$115.00,2025-09-16
TT-1059,Drawstring Linen Trousers,$92.00,2025-09-16
TT-1059,Technical Performance Joggers,$75.00,2025-09-16
TT-1060,Tailored Wool Dress Trousers,$145.00,2025-09-17
TT-1061,Striped Seersucker Trousers,$95.00,2025-09-17
TT-1062,Relaxed Fit Corduroy Trousers,$85.00,2025-09-18
TT-1063,Premium Tailored Trousers,$175.00,2025-09-18
TT-1064,Slim-Fit Denim Jeans,$88.00,2025-09-19
TT-1065,Flannel-Lined Canvas Work Pants,$98.00,2025-09-19
TT-1065,Classic Fit Chinos,$78.00,2025-09-19
TT-1066,Double-Pleated Khaki Trousers,$82.00,2025-09-20
TT-1067,Multi-Pocket Cargo Shorts,$58.00,2025-09-21
TT-1068,Technical Performance Joggers,$75.00,2025-09-21
TT-1069,Classic Denim Overalls,$115.00,2025-09-22
TT-1070,Drawstring Linen Trousers,$92.00,2025-09-22
TT-1071,Tailored Wool Dress Trousers,$145.00,2025-09-23
TT-1072,Slim-Fit Denim Jeans,$88.00,2025-09-23
TT-1072,Striped Seersucker Trousers,$95.00,2025-09-23
TT-1073,Relaxed Fit Corduroy Trousers,$85.00,2025-09-24
TT-1074,Classic Fit Chinos,$78.00,2025-09-24
TT-1075,Premium Tailored Trousers,$175.00,2025-09-25
TT-1076,Flannel-Lined Canvas Work Pants,$98.00,2025-09-26
TT-1077,Double-Pleated Khaki Trousers,$82.00,2025-09-26
TT-1078,Multi-Pocket Cargo Shorts,$58.00,2025-09-27
TT-1079,Technical Performance Joggers,$75.00,2025-09-27
TT-1079,Drawstring Linen Trousers,$92.00,2025-09-27
TT-1080,Classic Denim Overalls,$115.00,2025-09-28
TT-1081,Tailored Wool Dress Trousers,$145.00,2025-09-28
TT-1082,Slim-Fit Denim Jeans,$88.00,2025-09-29
TT-1083,Striped Seersucker Trousers,$95.00,2025-09-29
TT-1084,Relaxed Fit Corduroy Trousers,$85.00,2025-09-30
TT-1084,Classic Fit Chinos,$78.00,2025-09-30
TT-1085,Premium Tailored Trousers,$175.00,2025-10-01
TT-1086,Double-Pleated Khaki Trousers,$82.00,2025-10-01
TT-1087,Flannel-Lined Canvas Work Pants,$98.00,2025-10-02
TT-1088,Technical Performance Joggers,$75.00,2025-10-02
TT-1089,Multi-Pocket Cargo Shorts,$58.00,2025-10-03
TT-1090,Drawstring Linen Trousers,$92.00,2025-10-03
TT-1091,Classic Denim Overalls,$115.00,2025-10-04
TT-1092,Tailored Wool Dress Trousers,$145.00,2025-10-04
TT-1092,Classic Fit Chinos,$78.00,2025-10-04
TT-1093,Slim-Fit Denim Jeans,$88.00,2025-10-05
TT-1094,Striped Seersucker Trousers,$95.00,2025-10-05
TT-1095,Relaxed Fit Corduroy Trousers,$85.00,2025-10-06
TT-1096,Premium Tailored Trousers,$175.00,2025-10-06
TT-1097,Flannel-Lined Canvas Work Pants,$98.00,2025-10-07
TT-1097,Slim-Fit Denim Jeans,$88.00,2025-10-07
TT-1098,Double-Pleated Khaki Trousers,$82.00,2025-10-07`;

export const parseData = (csv: string): Order[] => {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const colIndex = {
    orderNumber: headers.findIndex(h => h.includes('order') || h.includes('id')),
    product: headers.findIndex(h => h.includes('product') || h.includes('item')),
    price: headers.findIndex(h => h.includes('price') || h.includes('amount') || h.includes('sales')),
    date: headers.findIndex(h => h.includes('date')),
    city: headers.findIndex(h => h.includes('city')),
    country: headers.findIndex(h => h.includes('country')),
    status: headers.findIndex(h => h.includes('status'))
  };

  return lines.slice(1).map((line, index) => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const cityData = CITIES[index % CITIES.length];
    
    const countryVal = colIndex.country !== -1 ? (values[colIndex.country] || '').trim() : cityData.country;
    const cityVal = colIndex.city !== -1 ? (values[colIndex.city] || '').trim() : cityData.name;

    let dateStr = colIndex.date !== -1 ? (values[colIndex.date] || '').replace(/"/g, '').trim() : '';
    
    // Improved date parsing
    if (dateStr && !isNaN(Number(dateStr)) && Number(dateStr) > 30000) {
      // Excel serial date
      const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
      dateStr = excelDate.toISOString().split('T')[0];
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
    }

    return {
      orderNumber: colIndex.orderNumber !== -1 ? (values[colIndex.orderNumber] || '').trim() : `ORD-${1000 + index}`,
      product: colIndex.product !== -1 ? (values[colIndex.product] || '').replace(/"/g, '').trim() : 'Unknown Product',
      price: colIndex.price !== -1 ? parseFloat((values[colIndex.price] || '0').replace(/[$,]/g, '')) : 0,
      date: dateStr || new Date().toISOString().split('T')[0],
      lat: cityData.lat,
      lng: cityData.lng,
      city: cityVal,
      country: countryVal,
      status: colIndex.status !== -1 ? (values[colIndex.status] || '').trim() : ['Shipped', 'In Process', 'On Hold', 'Cancelled', 'Disputed'][index % 5]
    };
  }).filter(order => order.orderNumber && !isNaN(order.price));
};
