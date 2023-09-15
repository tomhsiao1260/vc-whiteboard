import React, { useContext } from 'react'
import AppContext from '../../context/AppContext';
import useCardRender from '../../hooks/useCardRender';



export default function Card(props) {

    const AppContextData = useContext(AppContext);

    const options = props.options;
    const id = options.id;

    const renderer = useCardRender(AppContextData.WB, id);

    return (
        <></>
    )
}
