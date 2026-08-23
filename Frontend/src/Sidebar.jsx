import "./Sidebar.css";
function Sidebar(){
    return (
        <section className="sidebar">
            <button>
            <img src="src/assets/blacklogo.png" alt="gpt logo" className="logo" /> 
            <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>
            <ul className="history">
                <li>history1</li>
                <li>history2</li>
                <li>history3</li>
                <li>history4</li>
            </ul>

            <div className="sign">
                <p>By Dipak</p>
            </div>
        </section>
    )
}

export default Sidebar;