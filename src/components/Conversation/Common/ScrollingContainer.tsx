import React, { useEffect, useRef, useState } from 'react';

import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Icon from '@cloudscape-design/components/icon';

import { useDebouncedCallback } from 'use-debounce';

import { useScroll } from '@/hooks/useScroll';
import { useNotificationsContext } from '@/store/notifications';

import styles from './ScrollingContainer.module.css';

type ScrollingContainerProps = {
    containerTitle: string;
    children: React.ReactNode;
    showCopyIcon?: boolean;
};
export default function ScrollingContainer({ containerTitle, children, showCopyIcon }: ScrollingContainerProps) {
    const { addFlashMessage } = useNotificationsContext();
    const [showUpScroll, setShowUpScroll] = useState<boolean>(false);
    const [showDownScroll, setShowDownScroll] = useState<boolean>(false);

    // Use a ref for the right panel container, so we can show arrows for scrolling
    const childContainerRef = useRef(null);
    function handleScroll(e: Event) {
        const scrollElement = e.target as HTMLElement;
        const scrollLeftTop = scrollElement.scrollTop > 0;
        scrollLeftTop ? setShowUpScroll(true) : setShowUpScroll(false);
        const scrollAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop === scrollElement.clientHeight;
        scrollAtBottom ? setShowDownScroll(false) : setShowDownScroll(true);
    }
    const debouncedHandleScroll = useDebouncedCallback(handleScroll, 300);
    useScroll(childContainerRef, debouncedHandleScroll);

    // Show down scroll if the scroll height (entire child div) is larger than client height (visible child div)
    useEffect(() => {
        if (childContainerRef.current == null) return;
        const childContainer = childContainerRef.current as HTMLElement;
        if (childContainer.scrollHeight > childContainer.clientHeight) setShowDownScroll(true);
    }, [childContainerRef.current]);

    const copyFrameText = () => {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText && childContainerRef.current != null) {
            const childContainer = childContainerRef.current as HTMLElement;
            navigator.clipboard.writeText(childContainer.innerText);

            addFlashMessage({
                id: 'Copy text success',
                header: 'Success',
                content: 'Copied text to clipboard',
                type: 'success',
            });
        } else {
            addFlashMessage({
                id: 'Copy text error',
                header: 'Failed',
                content: 'Failed to copy text',
                type: 'error',
            });
        }
    }

    return (
        <Container header={<Header variant="h2">{containerTitle}</Header>}>
            {showUpScroll && (
                <div className={styles.scrollUpIcon}>
                    <Icon name="angle-up" size="medium" />
                </div>
            )}
            <div className={styles.childDiv} ref={childContainerRef}>
                {children}
            </div>
            <div className={styles.scrollBottom}>
                {showDownScroll && (
                    <div className={styles.scrollDownIcon}>
                        <Icon name="angle-down" size="medium" />
                    </div>
                )}
                {showCopyIcon && (
                    <div className={styles.copyIcon} onClick={copyFrameText}>
                        <Icon name="copy" size="medium" />
                    </div>
                )}
            </div>
        </Container>
    );
}
