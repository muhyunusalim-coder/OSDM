import {
 createBrowserRouter
}
from "react-router-dom";


import MainLayout
from "./src/layouts/MainLayout";


import DashboardPage
from "./src/features/dashboard/DashboardPage";


import EmployeePage
from "./src/features/employee/EmployeePage";


import KGBPage
from "./src/features/kgb/KGBPage";


import ReportPage
from "./src/features/report/ReportPage";


export const router =
createBrowserRouter([


{
 path:"/",
 element:<MainLayout/>,

 children:[


 {
 path:"",
 element:
 <DashboardPage/>
 },


 {
 path:"pegawai",
 element:
 <EmployeePage/>
 },


 {
 path:"kgb",
 element:
 <KGBPage/>
 },


 {
 path:"laporan",
 element:
 <ReportPage/>
 }


 ]


}


]);
