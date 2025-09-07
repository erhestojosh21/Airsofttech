
/**
 * Formats a date string into "Date: DD Mon, YYYY" and "Time: HH:MM am/pm".
 * @param {string} dateString The date string to format (e.g., from an API response).
 * @returns {JSX.Element} A React fragment with formatted date and time.
 */


export const formatOrderDateTime = (dateString) => {
    if (!dateString) {
        return <>
        <p>Date: N/A</p>
        <p>Time: N/A</p>
        </>;
    }
    const date = new Date(dateString);
    
    // Check if the date is valid. If not, return N/A.
    if (isNaN(date.getTime())) {
        return <>
        <p>Not Completed</p>
        </>;
    }

    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
    // 'en-US' locale typically formats as MM/DD/YYYY or similar, so we use replace
    // to get DD Mon, YYYY like '01 Jun, 2024'
    const formattedDate = date.toLocaleDateString('en-US', optionsDate)
                               .replace(/(\d{2})\/(\d{2})\/(\d{4})/, (match, m, d, y) => {
                                   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                   return `${d} ${monthNames[parseInt(m) - 1]}, ${y}`;
                               });

    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime).toLowerCase().replace(' ', ''); 

    return (
        <>
            Date: {formattedDate}
            <br />
            Time: {formattedTime}
        </>
    );
};

// Optionally, if you only need the combined string for search or other purposes
export const formatOrderDateForSearch = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', optionsDate)
                               .replace(/(\d{2})\/(\d{2})\/(\d{4})/, (match, m, d, y) => {
                                   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                   return `${d} ${monthNames[parseInt(m) - 1]}, ${y}`;
                               });
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime).toLowerCase().replace(' ', '');
    return `${formattedDate} ${formattedTime}`;
};