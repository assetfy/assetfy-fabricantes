
import { initPlasmicLoader } from "@plasmicapp/loader-react";

// ── UI Components ──
import Modal from "./components/Modal";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import Pagination from "./components/Pagination";
import Tabs from "./components/Tabs";
import Sidebar from "./components/Sidebar";
import PanelMenu from "./components/PanelMenu";
import UserHeader from "./components/UserHeader";
import StockModal from "./components/StockModal";

// ── Auth & Account ──
import Login from "./components/Login";
import ActivateAccount from "./components/ActivateAccount";
import Home from "./components/Home";

// ── Admin ──
import AdminPanel from "./components/AdminPanel";
import UserList from "./components/UserList";
import UserForm from "./components/UserForm";
import UserEditForm from "./components/UserEditForm";
import FabricanteList from "./components/FabricanteList";
import FabricanteForm from "./components/FabricanteForm";
import FabricanteEditForm from "./components/FabricanteEditForm";
import AuditoriaLog from "./components/AuditoriaLog";

// ── Apoderado ──
import ApoderadoPanel from "./components/ApoderadoPanel";
import AdministracionPanel from "./components/AdministracionPanel";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import ProductEditForm from "./components/ProductEditForm";
import PiezaList from "./components/PiezaList";
import PiezaForm from "./components/PiezaForm";
import PiezaEditForm from "./components/PiezaEditForm";
import InventarioList from "./components/InventarioList";
import InventarioForm from "./components/InventarioForm";
import InventarioItemViewModal from "./components/InventarioItemViewModal";
import RepresentanteList from "./components/RepresentanteList";
import RepresentanteForm from "./components/RepresentanteForm";
import RepresentanteEditForm from "./components/RepresentanteEditForm";
import ClientesList from "./components/ClientesList";
import ClienteModal from "./components/ClienteModal";
import ClientesGarantiasView from "./components/ClientesGarantiasView";

// ── Marcas & Ubicaciones ──
import MarcaList from "./components/MarcaList";
import MarcaForm from "./components/MarcaForm";
import MarcaEditForm from "./components/MarcaEditForm";
import UbicacionList from "./components/UbicacionList";
import UbicacionForm from "./components/UbicacionForm";
import UbicacionEditForm from "./components/UbicacionEditForm";

// ── Garantías ──
import WarrantyInfo from "./components/WarrantyInfo";
import WarrantyInfoReadOnly from "./components/WarrantyInfoReadOnly";
import WarrantyList from "./components/WarrantyList";
import WarrantyForm from "./components/WarrantyForm";
import WarrantyDetails from "./components/WarrantyDetails";
import WarrantyManagerForm from "./components/WarrantyManagerForm";
import WarrantySelector from "./components/WarrantySelector";
import GarantiasAsignadasList from "./components/GarantiasAsignadasList";
import GarantiaAsignadaDetailModal from "./components/GarantiaAsignadaDetailModal";
import ExtenderGarantiaModal from "./components/ExtenderGarantiaModal";

// ── Pedidos Garantía ──
import PedidoGarantiaList from "./components/PedidoGarantiaList";
import PedidoGarantiaForm from "./components/PedidoGarantiaForm";
import PedidoGarantiaDetail from "./components/PedidoGarantiaDetail";

// ── Bienes (Usuario) ──
import UsuarioPanel from "./components/UsuarioPanel";
import BienList from "./components/BienList";
import BienForm from "./components/BienForm";
import BienEditForm from "./components/BienEditForm";
import BienRegisterForm from "./components/BienRegisterForm";
import BienViewForm from "./components/BienViewForm";

// ── QR & Multimedia ──
import QRPreviewModal from "./components/QRPreviewModal";
import BulkQRPreviewModal from "./components/BulkQRPreviewModal";
import MultimediaForm from "./components/MultimediaForm";

// ── Solicitudes & Registro Público ──
import SolicitudRepresentacionForm from "./components/SolicitudRepresentacionForm";
import SolicitudRepresentacionList from "./components/SolicitudRepresentacionList";
import SolicitudRepresentacionDetail from "./components/SolicitudRepresentacionDetail";
import ChecklistRepresentante from "./components/ChecklistRepresentante";
import RegistroProducto from "./components/RegistroProducto";
import RegistroFabricante from "./components/RegistroFabricante";

// ── Checklist Config ──
import ChecklistConfigForm from "./components/ChecklistConfigForm";
import ChecklistConfigEditForm from "./components/ChecklistConfigEditForm";
import ChecklistConfigList from "./components/ChecklistConfigList";

// ── Attributes ──
import AttributesManager from "./components/AttributesManager";

// ── Reportes & Métricas ──
import MetricasPanel from "./components/MetricasPanel";
import ReportesPanel from "./components/ReportesPanel";
import VentasReportPanel from "./components/VentasReportPanel";
import AlertasPanel from "./components/AlertasPanel";
import ExportacionDatos from "./components/ExportacionDatos";
import ImportacionDatos from "./components/ImportacionDatos";
import DistribucionProvincias from "./components/DistribucionProvincias";
import MapaGeolocalizacion from "./components/MapaGeolocalizacion";

// ── Demo ──
import DemoPage from "./components/DemoPage";
import DemoAdminPanel from "./components/DemoAdminPanel";
import DemoApoderadoPanel from "./components/DemoApoderadoPanel";
import DemoMetricasPage from "./components/DemoMetricasPage";
import DemoProductList from "./components/DemoProductList";
import DemoRepresentanteForm from "./components/DemoRepresentanteForm";

// ── Tour ──
import TourOverlay from "./components/TourOverlay";
import TourTooltip from "./components/TourTooltip";

// ── Profile ──
import ProfileEditModal from "./components/ProfileEditModal";

// ─────────────────────────────────────────────
// Plasmic Loader Init
// ─────────────────────────────────────────────
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "m4gueuaeFTHSnAgegM6Ju3",
      token: "afkD3mYjpsDTS3CxRpccPiTMXotV2gBXDUaZ7FRnLb6C3Vp0xLWp6oFqeJPdG026mODm309s0r11uqv9S5enw"
    }
  ],
  preview: true,
});

// ─────────────────────────────────────────────
// Component Registration
// ─────────────────────────────────────────────

// ── UI Components ──

PLASMIC.registerComponent(Modal, {
  name: "Modal",
  props: {
    isOpen: "boolean",
    title: "string",
    children: "slot",
  },
  importPath: "./components/Modal",
});

PLASMIC.registerComponent(ConfirmDialog, {
  name: "ConfirmDialog",
  props: {
    isOpen: "boolean",
    title: "string",
    message: "string",
    confirmText: "string",
    cancelText: "string",
  },
  importPath: "./components/ConfirmDialog",
});

PLASMIC.registerComponent(Toast, {
  name: "Toast",
  props: {
    message: "string",
    type: {
      type: "choice",
      options: ["success", "error", "warning", "info"],
    },
    duration: "number",
  },
  importPath: "./components/Toast",
});

PLASMIC.registerComponent(Pagination, {
  name: "Pagination",
  props: {
    currentPage: "number",
    totalItems: "number",
    itemsPerPage: "number",
  },
  importPath: "./components/Pagination",
});

PLASMIC.registerComponent(Tabs, {
  name: "Tabs",
  props: {
    defaultTab: "number",
  },
  importPath: "./components/Tabs",
});

PLASMIC.registerComponent(Sidebar, {
  name: "Sidebar",
  props: {
    basePath: "string",
  },
  importPath: "./components/Sidebar",
});

PLASMIC.registerComponent(PanelMenu, {
  name: "PanelMenu",
  props: {
    userType: {
      type: "choice",
      options: ["admin", "apoderado", "usuario_bienes"],
    },
    hasFabricantePermissions: "boolean",
  },
  importPath: "./components/PanelMenu",
});

PLASMIC.registerComponent(UserHeader, {
  name: "UserHeader",
  props: {
    userType: {
      type: "choice",
      options: ["admin", "apoderado", "usuario_bienes"],
    },
    welcomeMessage: "string",
    pageTitle: "string",
  },
  importPath: "./components/UserHeader",
});

PLASMIC.registerComponent(StockModal, {
  name: "StockModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/StockModal",
});

// ── Auth & Account ──

PLASMIC.registerComponent(Login, {
  name: "Login",
  props: {},
  importPath: "./components/Login",
});

PLASMIC.registerComponent(ActivateAccount, {
  name: "ActivateAccount",
  props: {},
  importPath: "./components/ActivateAccount",
});

PLASMIC.registerComponent(Home, {
  name: "Home",
  props: {},
  importPath: "./components/Home",
});

// ── Admin Panel & CRUD ──

PLASMIC.registerComponent(AdminPanel, {
  name: "AdminPanel",
  props: {},
  importPath: "./components/AdminPanel",
});

PLASMIC.registerComponent(UserList, {
  name: "UserList",
  props: {},
  importPath: "./components/UserList",
});

PLASMIC.registerComponent(UserForm, {
  name: "UserForm",
  props: {},
  importPath: "./components/UserForm",
});

PLASMIC.registerComponent(UserEditForm, {
  name: "UserEditForm",
  props: {},
  importPath: "./components/UserEditForm",
});

PLASMIC.registerComponent(FabricanteList, {
  name: "FabricanteList",
  props: {},
  importPath: "./components/FabricanteList",
});

PLASMIC.registerComponent(FabricanteForm, {
  name: "FabricanteForm",
  props: {},
  importPath: "./components/FabricanteForm",
});

PLASMIC.registerComponent(FabricanteEditForm, {
  name: "FabricanteEditForm",
  props: {},
  importPath: "./components/FabricanteEditForm",
});

PLASMIC.registerComponent(AuditoriaLog, {
  name: "AuditoriaLog",
  props: {},
  importPath: "./components/AuditoriaLog",
});

// ── Apoderado Panel ──

PLASMIC.registerComponent(ApoderadoPanel, {
  name: "ApoderadoPanel",
  props: {},
  importPath: "./components/ApoderadoPanel",
});

PLASMIC.registerComponent(AdministracionPanel, {
  name: "AdministracionPanel",
  props: {},
  importPath: "./components/AdministracionPanel",
});

// ── Products ──

PLASMIC.registerComponent(ProductList, {
  name: "ProductList",
  props: {},
  importPath: "./components/ProductList",
});

PLASMIC.registerComponent(ProductForm, {
  name: "ProductForm",
  props: {},
  importPath: "./components/ProductForm",
});

PLASMIC.registerComponent(ProductEditForm, {
  name: "ProductEditForm",
  props: {},
  importPath: "./components/ProductEditForm",
});

// ── Piezas ──

PLASMIC.registerComponent(PiezaList, {
  name: "PiezaList",
  props: {},
  importPath: "./components/PiezaList",
});

PLASMIC.registerComponent(PiezaForm, {
  name: "PiezaForm",
  props: {},
  importPath: "./components/PiezaForm",
});

PLASMIC.registerComponent(PiezaEditForm, {
  name: "PiezaEditForm",
  props: {},
  importPath: "./components/PiezaEditForm",
});

// ── Inventario ──

PLASMIC.registerComponent(InventarioList, {
  name: "InventarioList",
  props: {},
  importPath: "./components/InventarioList",
});

PLASMIC.registerComponent(InventarioForm, {
  name: "InventarioForm",
  props: {},
  importPath: "./components/InventarioForm",
});

PLASMIC.registerComponent(InventarioItemViewModal, {
  name: "InventarioItemViewModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/InventarioItemViewModal",
});

// ── Representantes ──

PLASMIC.registerComponent(RepresentanteList, {
  name: "RepresentanteList",
  props: {},
  importPath: "./components/RepresentanteList",
});

PLASMIC.registerComponent(RepresentanteForm, {
  name: "RepresentanteForm",
  props: {},
  importPath: "./components/RepresentanteForm",
});

PLASMIC.registerComponent(RepresentanteEditForm, {
  name: "RepresentanteEditForm",
  props: {},
  importPath: "./components/RepresentanteEditForm",
});

// ── Clientes ──

PLASMIC.registerComponent(ClientesList, {
  name: "ClientesList",
  props: {},
  importPath: "./components/ClientesList",
});

PLASMIC.registerComponent(ClienteModal, {
  name: "ClienteModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/ClienteModal",
});

PLASMIC.registerComponent(ClientesGarantiasView, {
  name: "ClientesGarantiasView",
  props: {},
  importPath: "./components/ClientesGarantiasView",
});

// ── Marcas ──

PLASMIC.registerComponent(MarcaList, {
  name: "MarcaList",
  props: {},
  importPath: "./components/MarcaList",
});

PLASMIC.registerComponent(MarcaForm, {
  name: "MarcaForm",
  props: {},
  importPath: "./components/MarcaForm",
});

PLASMIC.registerComponent(MarcaEditForm, {
  name: "MarcaEditForm",
  props: {},
  importPath: "./components/MarcaEditForm",
});

// ── Ubicaciones ──

PLASMIC.registerComponent(UbicacionList, {
  name: "UbicacionList",
  props: {},
  importPath: "./components/UbicacionList",
});

PLASMIC.registerComponent(UbicacionForm, {
  name: "UbicacionForm",
  props: {},
  importPath: "./components/UbicacionForm",
});

PLASMIC.registerComponent(UbicacionEditForm, {
  name: "UbicacionEditForm",
  props: {},
  importPath: "./components/UbicacionEditForm",
});

// ── Garantías ──

PLASMIC.registerComponent(WarrantyInfo, {
  name: "WarrantyInfo",
  props: {
    allowEdit: "boolean",
  },
  importPath: "./components/WarrantyInfo",
});

PLASMIC.registerComponent(WarrantyInfoReadOnly, {
  name: "WarrantyInfoReadOnly",
  props: {},
  importPath: "./components/WarrantyInfoReadOnly",
});

PLASMIC.registerComponent(WarrantyList, {
  name: "WarrantyList",
  props: {},
  importPath: "./components/WarrantyList",
});

PLASMIC.registerComponent(WarrantyForm, {
  name: "WarrantyForm",
  props: {},
  importPath: "./components/WarrantyForm",
});

PLASMIC.registerComponent(WarrantyDetails, {
  name: "WarrantyDetails",
  props: {},
  importPath: "./components/WarrantyDetails",
});

PLASMIC.registerComponent(WarrantyManagerForm, {
  name: "WarrantyManagerForm",
  props: {},
  importPath: "./components/WarrantyManagerForm",
});

PLASMIC.registerComponent(WarrantySelector, {
  name: "WarrantySelector",
  props: {},
  importPath: "./components/WarrantySelector",
});

PLASMIC.registerComponent(GarantiasAsignadasList, {
  name: "GarantiasAsignadasList",
  props: {},
  importPath: "./components/GarantiasAsignadasList",
});

PLASMIC.registerComponent(GarantiaAsignadaDetailModal, {
  name: "GarantiaAsignadaDetailModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/GarantiaAsignadaDetailModal",
});

PLASMIC.registerComponent(ExtenderGarantiaModal, {
  name: "ExtenderGarantiaModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/ExtenderGarantiaModal",
});

// ── Pedidos Garantía ──

PLASMIC.registerComponent(PedidoGarantiaList, {
  name: "PedidoGarantiaList",
  props: {},
  importPath: "./components/PedidoGarantiaList",
});

PLASMIC.registerComponent(PedidoGarantiaForm, {
  name: "PedidoGarantiaForm",
  props: {},
  importPath: "./components/PedidoGarantiaForm",
});

PLASMIC.registerComponent(PedidoGarantiaDetail, {
  name: "PedidoGarantiaDetail",
  props: {},
  importPath: "./components/PedidoGarantiaDetail",
});

// ── Bienes (Usuario) ──

PLASMIC.registerComponent(UsuarioPanel, {
  name: "UsuarioPanel",
  props: {},
  importPath: "./components/UsuarioPanel",
});

PLASMIC.registerComponent(BienList, {
  name: "BienList",
  props: {},
  importPath: "./components/BienList",
});

PLASMIC.registerComponent(BienForm, {
  name: "BienForm",
  props: {},
  importPath: "./components/BienForm",
});

PLASMIC.registerComponent(BienEditForm, {
  name: "BienEditForm",
  props: {},
  importPath: "./components/BienEditForm",
});

PLASMIC.registerComponent(BienRegisterForm, {
  name: "BienRegisterForm",
  props: {},
  importPath: "./components/BienRegisterForm",
});

PLASMIC.registerComponent(BienViewForm, {
  name: "BienViewForm",
  props: {},
  importPath: "./components/BienViewForm",
});

// ── QR & Multimedia ──

PLASMIC.registerComponent(QRPreviewModal, {
  name: "QRPreviewModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/QRPreviewModal",
});

PLASMIC.registerComponent(BulkQRPreviewModal, {
  name: "BulkQRPreviewModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/BulkQRPreviewModal",
});

PLASMIC.registerComponent(MultimediaForm, {
  name: "MultimediaForm",
  props: {},
  importPath: "./components/MultimediaForm",
});

// ── Solicitudes & Registro Público ──

PLASMIC.registerComponent(SolicitudRepresentacionForm, {
  name: "SolicitudRepresentacionForm",
  props: {},
  importPath: "./components/SolicitudRepresentacionForm",
});

PLASMIC.registerComponent(SolicitudRepresentacionList, {
  name: "SolicitudRepresentacionList",
  props: {},
  importPath: "./components/SolicitudRepresentacionList",
});

PLASMIC.registerComponent(SolicitudRepresentacionDetail, {
  name: "SolicitudRepresentacionDetail",
  props: {},
  importPath: "./components/SolicitudRepresentacionDetail",
});

PLASMIC.registerComponent(ChecklistRepresentante, {
  name: "ChecklistRepresentante",
  props: {},
  importPath: "./components/ChecklistRepresentante",
});

PLASMIC.registerComponent(RegistroProducto, {
  name: "RegistroProducto",
  props: {},
  importPath: "./components/RegistroProducto",
});

PLASMIC.registerComponent(RegistroFabricante, {
  name: "RegistroFabricante",
  props: {},
  importPath: "./components/RegistroFabricante",
});

// ── Checklist Config ──

PLASMIC.registerComponent(ChecklistConfigForm, {
  name: "ChecklistConfigForm",
  props: {},
  importPath: "./components/ChecklistConfigForm",
});

PLASMIC.registerComponent(ChecklistConfigEditForm, {
  name: "ChecklistConfigEditForm",
  props: {},
  importPath: "./components/ChecklistConfigEditForm",
});

PLASMIC.registerComponent(ChecklistConfigList, {
  name: "ChecklistConfigList",
  props: {},
  importPath: "./components/ChecklistConfigList",
});

// ── Attributes ──

PLASMIC.registerComponent(AttributesManager, {
  name: "AttributesManager",
  props: {},
  importPath: "./components/AttributesManager",
});

// ── Reportes & Métricas ──

PLASMIC.registerComponent(MetricasPanel, {
  name: "MetricasPanel",
  props: {},
  importPath: "./components/MetricasPanel",
});

PLASMIC.registerComponent(ReportesPanel, {
  name: "ReportesPanel",
  props: {},
  importPath: "./components/ReportesPanel",
});

PLASMIC.registerComponent(VentasReportPanel, {
  name: "VentasReportPanel",
  props: {},
  importPath: "./components/VentasReportPanel",
});

PLASMIC.registerComponent(AlertasPanel, {
  name: "AlertasPanel",
  props: {},
  importPath: "./components/AlertasPanel",
});

PLASMIC.registerComponent(ExportacionDatos, {
  name: "ExportacionDatos",
  props: {},
  importPath: "./components/ExportacionDatos",
});

PLASMIC.registerComponent(ImportacionDatos, {
  name: "ImportacionDatos",
  props: {},
  importPath: "./components/ImportacionDatos",
});

PLASMIC.registerComponent(DistribucionProvincias, {
  name: "DistribucionProvincias",
  props: {},
  importPath: "./components/DistribucionProvincias",
});

PLASMIC.registerComponent(MapaGeolocalizacion, {
  name: "MapaGeolocalizacion",
  props: {},
  importPath: "./components/MapaGeolocalizacion",
});

// ── Demo ──

PLASMIC.registerComponent(DemoPage, {
  name: "DemoPage",
  props: {},
  importPath: "./components/DemoPage",
});

PLASMIC.registerComponent(DemoAdminPanel, {
  name: "DemoAdminPanel",
  props: {},
  importPath: "./components/DemoAdminPanel",
});

PLASMIC.registerComponent(DemoApoderadoPanel, {
  name: "DemoApoderadoPanel",
  props: {},
  importPath: "./components/DemoApoderadoPanel",
});

PLASMIC.registerComponent(DemoMetricasPage, {
  name: "DemoMetricasPage",
  props: {},
  importPath: "./components/DemoMetricasPage",
});

PLASMIC.registerComponent(DemoProductList, {
  name: "DemoProductList",
  props: {},
  importPath: "./components/DemoProductList",
});

PLASMIC.registerComponent(DemoRepresentanteForm, {
  name: "DemoRepresentanteForm",
  props: {},
  importPath: "./components/DemoRepresentanteForm",
});

// ── Tour ──

PLASMIC.registerComponent(TourOverlay, {
  name: "TourOverlay",
  props: {},
  importPath: "./components/TourOverlay",
});

PLASMIC.registerComponent(TourTooltip, {
  name: "TourTooltip",
  props: {},
  importPath: "./components/TourTooltip",
});

// ── Profile ──

PLASMIC.registerComponent(ProfileEditModal, {
  name: "ProfileEditModal",
  props: {
    isOpen: "boolean",
  },
  importPath: "./components/ProfileEditModal",
});
