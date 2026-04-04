const tourSteps = [
    {
        id: 'welcome',
        target: '[data-tour-id="tour-header"]',
        title: 'Bienvenido a Assetfy',
        description: 'Este es tu panel de control. Desde aqui podras gestionar todos los aspectos de tu negocio: productos, representantes, garantias y mucho mas. Te mostraremos cada seccion en unos segundos.',
        route: '/apoderado/metricas',
        placement: 'bottom',
        animation: 'welcome'
    },
    {
        id: 'dashboard',
        target: '[data-tour-id="tour-dashboard"]',
        title: 'Panel de Metricas',
        description: 'Visualiza el rendimiento de tu negocio en tiempo real. Aqui encontraras KPIs clave, graficos de tendencias y un resumen general de la actividad de tus productos y representantes.',
        route: '/apoderado/metricas',
        placement: 'right',
        animation: 'barChart',
        expandGroup: null
    },
    {
        id: 'productos',
        target: '[data-tour-id="tour-productos"]',
        title: 'Gestion de Productos',
        description: 'Administra tu catalogo completo de productos. Crea, edita y organiza tus productos con toda su informacion: imagenes, especificaciones, codigos QR y mas.',
        route: '/apoderado/productos',
        placement: 'right',
        animation: 'addCard',
        expandGroup: 'tour-mis-productos'
    },
    {
        id: 'piezas',
        target: '[data-tour-id="tour-piezas"]',
        title: 'Repuestos y Piezas',
        description: 'Gestiona los componentes y repuestos asociados a tus productos. Lleva un control detallado del stock y la disponibilidad de cada pieza.',
        route: '/apoderado/piezas',
        placement: 'right',
        animation: 'gear',
        expandGroup: 'tour-mis-productos'
    },
    {
        id: 'representantes',
        target: '[data-tour-id="tour-representantes"]',
        title: 'Red de Representantes',
        description: 'Administra tu red de representantes oficiales y canales comerciales. Visualiza su ubicacion en el mapa, gestiona territorios y monitorea su actividad.',
        route: '/apoderado/representantes',
        placement: 'right',
        animation: 'network'
    },
    {
        id: 'alertas',
        target: '[data-tour-id="tour-alertas"]',
        title: 'Centro de Alertas',
        description: 'Recibe notificaciones sobre eventos importantes: solicitudes de representacion, stock bajo, nuevas activaciones de productos y mas.',
        route: '/apoderado/alertas',
        placement: 'right',
        animation: 'bell'
    },
    {
        id: 'clientes',
        target: '[data-tour-id="tour-clientes"]',
        title: 'Clientes y Garantias',
        description: 'Gestiona las activaciones de productos por parte de tus clientes y administra las solicitudes de garantia. Lleva un historial completo de cada equipo.',
        route: '/apoderado/garantias',
        placement: 'right',
        animation: 'shield'
    },
    {
        id: 'reportes',
        target: '[data-tour-id="tour-reportes"]',
        title: 'Reportes y Exportacion',
        description: 'Genera y exporta reportes detallados de tu operacion. Descarga datos en formato CSV o Excel para analisis externos.',
        route: '/apoderado/reportes',
        placement: 'right',
        animation: 'download',
        expandGroup: 'tour-reportes-group'
    },
    {
        id: 'administracion',
        target: '[data-tour-id="tour-administracion"]',
        title: 'Configuracion General',
        description: 'Aqui configuras los parametros de tu cuenta: Ubicaciones, Marcas, Tipos de Garantia, Branding de tu portal, Checklists personalizados e Importacion masiva de datos.',
        route: '/apoderado/administracion',
        placement: 'right',
        animation: 'settings'
    }
];

export default tourSteps;
