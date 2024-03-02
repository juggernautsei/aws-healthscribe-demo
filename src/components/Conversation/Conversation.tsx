// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import ContentLayout from '@cloudscape-design/components/content-layout';
import Grid from '@cloudscape-design/components/grid';

import { useAudio } from '@/hooks/useAudio';
import { useNotificationsContext } from '@/store/notifications';
import { IAuraClinicalDocOutput, IAuraTranscriptOutput } from '@/types/HealthScribe';
import { getHealthScribeJob } from '@/utils/HealthScribeApi';
import { getObject, getS3Object } from '@/utils/S3Api';

import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import TopPanel from './TopPanel';
import ViewResults from './ViewResults';
import { HealthScribeJob } from './types';
import { useAuthContext } from '@/store/auth';
import crypto from 'crypto-js';

export default function Conversation() {
    const navigate = useNavigate();
    const { conversationName } = useParams();
    const { addFlashMessage } = useNotificationsContext();

    const [jobLoading, setJobLoading] = useState(true); // Is getHealthScribeJob in progress
    const [jobDetails, setJobDetails] = useState<HealthScribeJob | null>(null); // HealthScribe job details
    const [viewResultsModal, setViewResultsModal] = useState<boolean>(false); // Is view results modal open

    const [clinicalDocument, setClinicalDocument] = useState<IAuraClinicalDocOutput | null>(null);
    const [transcriptFile, setTranscriptFile] = useState<IAuraTranscriptOutput | null>(null);
    const { user } = useAuthContext();

    const [
        wavesurfer,
        audioReady,
        setAudioReady,
        audioTime,
        setAudioTime,
        smallTalkCheck,
        setSmallTalkCheck,
        highlightId,
        setHighlightId,
    ] = useAudio();

    useEffect(() => {
        async function getJob(conversationName: string) {
            try {
                setJobLoading(true);
                const userPrefix = crypto.SHA256(!user ? "" : user.username ?? "") + "";

                const getHealthScribeJobRsp = await getHealthScribeJob({ MedicalScribeJobName: conversationName });
                const MedicalScribeJob = getHealthScribeJobRsp.data?.MedicalScribeJob;
                
                console.log(getHealthScribeJobRsp);
                if (!conversationName.startsWith(userPrefix))
                    navigate('/conversations');

                if (Object.keys(MedicalScribeJob).length > 0) {
                    setJobDetails(MedicalScribeJob);
                }

                // Get Clinical Document from result S3 URL
                const clinicalDocumentUri = MedicalScribeJob.MedicalScribeOutput?.ClinicalDocumentUri;
                const clinicalDocumentRsp = await getObject(getS3Object(clinicalDocumentUri));
                setClinicalDocument(JSON.parse((await clinicalDocumentRsp?.Body?.transformToString()) || ''));

                // Get Transcript File from result S3 URL
                const transcriptFileUri = MedicalScribeJob.MedicalScribeOutput?.TranscriptFileUri;
                const transcriptFileRsp = await getObject(getS3Object(transcriptFileUri));
                setTranscriptFile(JSON.parse((await transcriptFileRsp?.Body?.transformToString()) || ''));
            } catch (e) {
                setJobDetails(null);
                setJobLoading(false);
                addFlashMessage({
                    id: e?.toString() || 'GetHealthScribeJob error',
                    header: 'Conversation Error',
                    content: e?.toString() || 'GetHealthScribeJob error',
                    type: 'error',
                });
            }
            setJobLoading(false);
        }
        if (!conversationName) {
            return;
        } else {
            getJob(conversationName).catch(console.error);
        }
    }, []);

    return (
        <ContentLayout>
            <ViewResults
                visible={viewResultsModal}
                setVisible={setViewResultsModal}
                transcriptString={JSON.stringify(transcriptFile || 'Loading...', null, 2)}
                clinicalDocumentString={JSON.stringify(clinicalDocument || 'Loading...', null, 2)}
            />
            <Grid
                gridDefinition={[
                    { colspan: { default: 12 } },
                    { colspan: { default: 6 } },
                    { colspan: { default: 6 } },
                ]}
            >
                <TopPanel
                    jobLoading={jobLoading}
                    jobDetails={jobDetails}
                    transcriptFile={transcriptFile}
                    wavesurfer={wavesurfer}
                    smallTalkCheck={smallTalkCheck}
                    setSmallTalkCheck={setSmallTalkCheck}
                    setAudioTime={setAudioTime}
                    setAudioReady={setAudioReady}
                    setViewResultsModal={setViewResultsModal}
                />
                <LeftPanel
                    jobLoading={jobLoading}
                    transcriptFile={transcriptFile}
                    highlightId={highlightId}
                    setHighlightId={setHighlightId}
                    wavesurfer={wavesurfer}
                    smallTalkCheck={smallTalkCheck}
                    audioTime={audioTime}
                    setAudioTime={setAudioTime}
                    audioReady={audioReady}
                />
                <RightPanel
                    jobLoading={jobLoading}
                    clinicalDocument={clinicalDocument}
                    transcriptFile={transcriptFile}
                    highlightId={highlightId}
                    setHighlightId={setHighlightId}
                    wavesurfer={wavesurfer}
                />
            </Grid>
        </ContentLayout>
    );
}
