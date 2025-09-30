// Detecta si la URL tiene 'www.' o no y devuelve la base correcta
const getBaseURL = () => {
    const currentHost = window.location.hostname; // Obtiene el host actual
    if (currentHost.startsWith('www.')) {
        return 'https://www.sistema-mesas.encatalogo.com';
    } else {
        return 'https://sistema-mesas.encatalogo.com';
    }
};

const baseURL = getBaseURL(); // Obtiene la URL base correcta

export default baseURL;
