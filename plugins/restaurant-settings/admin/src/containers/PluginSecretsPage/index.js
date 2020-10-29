import React, { useState, useEffect } from 'react'
import { Block, Container } from '../../components/strapiStyles';
import { InputText, Button, Padded } from '@buffetjs/core';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';

const index = () => {
    const [secrets, setSecrets] = useState({
        stripePKSecret: '',
        orderIdSecret: '',
    });


    useEffect(() => {
        const run = async () => await getSecretsDB();
        run();
    }, [])


    const updateSecrets = ({ value, key }) => {
        setSecrets({ ...secrets, [key]: value });
    }

    const getSecretsDB = async () => {
        const res = await request(`/${pluginId}/settings/secrets`, { method: 'GET' });
        const { secrets } = res;
        setSecrets(secrets);
    }

    const updateSecretsDB = async (e) => {
        e.preventDefault();
        strapi.lockApp();

        try {
            const res = await request(`/${pluginId}/settings/secrets`, {
                method: 'POST',
                body: { ...secrets }
            });
            strapi.notification.success('success');
        } catch (err) {
            strapi.notification.error(err.response.payload.message);
        }

        strapi.unlockApp();

    }

    return (
        <div className="row">
            <div className="col-md-12">
                <Container>
                    <form onSubmit={updateSecretsDB}>
                        <Button color="success" label="Save" type="submit" />
                        <Block>
                            <h2>Stripe</h2>
                            <p>Save your private key </p>
                            <InputText
                                onChange={(e) => updateSecrets({ value: e.target.value, key: 'stripePKSecret' })}
                                value={secrets.stripePKSecret}
                                name="stripe-secret"
                                type="Password"
                                placeholder="Stripe Private Key" />

                            <h2>Order Id</h2>
                            <p>Save your order id secret</p>
                            <InputText
                                onChange={(e) => updateSecrets({ value: e.target.value, key: 'orderIdSecret' })}
                                value={secrets.orderIdSecret}
                                name="order-id-secret"
                                type="Password"
                                placeholder="OrderId Secret" />
                        </Block>
                    </form>
                </Container>
            </div>
        </div>
    )
}

export default index
