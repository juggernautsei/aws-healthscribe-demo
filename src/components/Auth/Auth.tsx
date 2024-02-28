// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// This is a modal authentication component that displays the AWS Amplify Authenticator.
import React, { useMemo } from 'react';

import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { Auth as AmplifyAuth } from '@aws-amplify/auth';
import { Authenticator, ThemeProvider, defaultDarkModeOverride } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import axios from 'axios';

import { useAppThemeContext } from '@/store/appTheme';

const authUiComponents = {
    SignUp: {
        Header() {
            return (
                <div
                    style={{
                        textAlign: 'center',
                        paddingTop: '10px',
                        fontStyle: 'italic',
                    }}
                >
                    A verification code will be sent to your email address to validate the account.
                </div>
            );
        },
    },
};

type AuthParams = {
    visible: boolean;
    setVisible: (visible: boolean) => void;
};

export default function Auth({ visible, setVisible }: AuthParams) {
    const { appTheme } = useAppThemeContext();

    /**
     * Amplify-UI's <Authentication /> uses 80 for the button, 90 for hover
     * Override to Cloudscape colors - https://cloudscape.design/foundation/visual-foundation/colors/
     * light mode primary : blue-800 #033160
     * light mode hover   : blue-600 #0972d3
     * dark mode primary  : blue-500 #539fe5
     * dark mode hover    : blue-400 #89bdee
     */
    const theme = {
        name: 'AuthTheme',
        overrides: [defaultDarkModeOverride],
        tokens: {
            colors: {
                brand: {
                    primary: {
                        80: appTheme === 'theme.light' ? '#033160' : '#539fe5',
                        90: appTheme === 'theme.light' ? '#0972d3' : '#89bdee',
                        100: appTheme === 'theme.light' ? '#033160' : '#539fe5',
                    },
                },
            },
            components: {
                tabs: {
                    item: {
                        _hover: {
                            color: {
                                value: appTheme === 'theme.light' ? '#0972d3' : '#89bdee',
                            },
                        },
                    },
                },
            },
        },
    };

    const colorMode = useMemo(() => {
        if (appTheme === 'theme.light') {
            return 'light';
        } else if (appTheme === 'theme.dark') {
            return 'dark';
        } else {
            return 'system';
        }
    }, [appTheme]);

    const checkCreditCardStatus = async (email: string) => {
        try {
            const response = await axios.get(
                `https://api.affordablecustomehr.com/stripe/resources/connection/api.php?email=${email}`
            );
            return response.data && response.data.user === true;
        } catch {
            return false;
        }
    };

    const services = {
        async handleSignUp(formData: any) {
            let { username, password, attributes } = formData;
            username = username.toLowerCase();
            attributes.email = username;

            const signUp = AmplifyAuth.signUp({
                username,
                password,
                attributes,
            });

            const hasCreditCard = await checkCreditCardStatus(username);

            if (!hasCreditCard) {
                window.open('https://api.affordablecustomehr.com/stripe/', '_blank');
            }
            return signUp;
        },
        async handleSignIn({ username, password }: { username: string; password: string }) {
            const hasCreditCard = await checkCreditCardStatus(username);

            if (!hasCreditCard) {
                window.open('https://api.affordablecustomehr.com/stripe/', '_blank');
            }

            return AmplifyAuth.signIn({
                username,
                password,
            });
        },
    };

    return (
        <Modal
            onDismiss={() => setVisible(false)}
            visible={visible}
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setVisible(false)}>
                            Cancel
                        </Button>
                    </SpaceBetween>
                </Box>
            }
        >
            <ThemeProvider theme={theme} colorMode={colorMode}>
                <Authenticator components={authUiComponents} services={services}>
                    <Box variant="p" textAlign="center">
                        You will be redirected shortly.
                    </Box>
                </Authenticator>
            </ThemeProvider>
        </Modal>
    );
}
