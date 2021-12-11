// Navigation bar component

const NavBar = () => (
    <>
        <nav className="nav"></nav>
        <style jsx>{`
            .nav {
                width: 100%;
                height: 80px;
                padding: 0 max(calc(50vw - 550px), 20px);
            }
        `}</style>
    </>
)

// Layout component

const Layout = () => (
    <NavBar></NavBar>
)

// Exports

export default Layout