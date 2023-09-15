import React from 'react'

export default function Card(props) {

    const options = props.options;
    const id = options.id;

    const renderer = useCardRender(id);

    return (
        <></>
    )
}
