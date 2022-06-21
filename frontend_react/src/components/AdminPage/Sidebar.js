import { Container } from 'react-bootstrap';
import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'react-pro-sidebar/dist/css/styles.css';

const Sidebar = () => {

    const [windowDimenion, detectHW] = useState({
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
      })
    
      const detectSize = () => {
        detectHW({
          winWidth: window.innerWidth,
          winHeight: window.innerHeight,
        })
      }
    
      useEffect(() => {
        window.addEventListener('resize', detectSize)
    
        return () => {
          window.removeEventListener('resize', detectSize)
        }
      }, [windowDimenion])

      
    return(
    <ProSidebar style={{height:windowDimenion.winHeight}}>
    <Menu iconShape="square">
    <MenuItem >Dashboard</MenuItem>
    <MenuItem >Users
    <Link to="/admin/users" /></MenuItem>

  </Menu>
</ProSidebar>

  );

}
export default Sidebar;