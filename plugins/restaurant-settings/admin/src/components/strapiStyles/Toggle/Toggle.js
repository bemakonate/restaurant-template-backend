import React from 'react';
import StrapiToggle from './StrapiToggle';
import { Label, Padded } from '@buffetjs/core';

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
}
const Toggle = ({ onChange, name, value }) => {
    return (
        <Padded top bottom left right size="md">
            <Label htmlFor={name}>{capitalize(name)}</Label>
            <StrapiToggle onChange={onChange} name={name} value={value} />
        </Padded>

    )
}

export default Toggle
