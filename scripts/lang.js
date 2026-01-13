const i18n = {
    'pt-br': {
        nav_projects: "Projetos",
        nav_about: "Sobre",
        btn_theme: "Troca de Reino",
        lang_protocol: "Protocolo",
        status_text: "Status: Operando_Normal",
        search_placeholder: "PESQUISAR_ARQUIVOS...",
        title_profile: "■ Perfil_Dev",
        bio_scan: "■ Scan_Biometrico",
        label_id: "ID_Operador",
        label_role: "■ Função Principal",
        label_seniority: "■ Senioridade",
        label_exp: "■ Experiência",
        unit_years: "ANOS",
        label_avail: "■ Disponibilidade",
        status_avail: "Disponível para contrato",
        btn_cv: "Baixar_CV",
        cv_version: "Tipo: PDF // v2.0",
        title_contact: "■ Contate_Me",
        comm_channel: "Canal_de_Comunicação_Alpha",
        secure_msg: "// aperto_de_mao_seguro",
        request_msg: "// requisitando_pacote_dados",
        btn_send: "[ENVIAR]",
        title_network: "■ Links_de_Rede",
        title_projects: "■ Registros_de_Projeto",
        title_exp: "■ Linha_do_Tempo_Experiencia",
        sys_online: "Status_do_Sistema: Online",
        made_with: "Feito com Tailwind e Feitiçaria",
        footer_termination: "// Links_de_Terminação",
        return_top: ">> Voltar_ao_Topo",
        send_transmission: ">> Enviar_Transmissão"
        , dev_data: "Dados_Solicitados_do_Desenvolvedor",
        social_links: "Links_Sociais_Requisitados"
        , project_data: "Dados_Solicitados_do_Projeto",
        period: "Registro_Período",
        deploy: "// OPERACIONAL_EM:",
        skills_used: "Habilidades_Utilizadas",
        click_to_decrypt: "// Descriptografar",
        access_fragment: "Fragmento_Acessado",
        decrypt_fragment: "Acessar_Fragmento",
        data_fragment: "FRAGMENTO_DE_DADOS",
        transmission_source: "Fonte_de_Transmissão",
        contact_text: "Ainda restam dúvidas? Sinta-se à vontade para contatar-me pelos canais abaixo.",
        prev_sector: "◀ SETOR_ANTERIOR",
        next_sector: "PRÓXIMO_SETOR ▶",
        stream_active: "FLUXO_ATIVO"
    },
    'en': {
        nav_projects: "Projects",
        nav_about: "About",
        btn_theme: "Realm Shift",
        lang_protocol: "Protocol",
        status_text: "Status: Operating_Normal",
        search_placeholder: "SEARCH_FILES...",
        title_profile: "■ Dev_Profile",
        bio_scan: "■ Bio_Metric_Scan",
        label_id: "Operator_ID",
        label_role: "■ Main Role",
        label_seniority: "■ Seniority",
        label_exp: "■ Experience",
        unit_years: "YEARS",
        label_avail: "■ Availability",
        status_avail: "Available for hire",
        btn_cv: "Download_CV",
        cv_version: "File_Type: PDF // v2.0",
        title_contact: "■ Contact_Me",
        comm_channel: "Comm_Channel_Alpha",
        secure_msg: "// secure_handshake_established",
        request_msg: "// requesting_data_packet",
        btn_send: "[SEND]",
        title_network: "■ Network_Links",
        title_projects: "■ Project_Logs",
        title_exp: "■ Work_Experience_Timeline",
        sys_online: "System_Status: Online",
        made_with: "Made with Tailwind and Sorcery",
        footer_termination: "// Termination_Links",
        return_top: ">> Return_to_Top",
        send_transmission: ">> Send_Transmission",
        dev_data: "Requested_Developer_Data",
        social_links: "Requested_Social_Links",
        project_data: "Requested_Project_Data",
        period: "Period_Log",
        deploy: "// DEPLOYED_AT:",
        skills_used: "Skills_Used",
        click_to_decrypt: "// Decrypt",
        access_fragment: "Fragment_Accessed",
        decrypt_fragment: "Access_Fragment",
        data_fragment: "DATA_FRAGMENT",
        transmission_source: "Transmission_Source",
        contact_text: "Still have questions? Feel free to reach out through the channels below.",
        prev_sector: "◀ PREV_SECTOR",
        next_sector: "NEXT_SECTOR ▶",
        stream_active: "STREAM_ACTIVE"
    }
};

let currentLang = localStorage.getItem('pref-lang') || 'en';

function updateInterfaceStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang][key]) el.innerText = i18n[currentLang][key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[currentLang][key]) el.placeholder = i18n[currentLang][key];
    });

    const langLabel = document.getElementById('current-lang');
    if (langLabel) langLabel.innerText = currentLang.toUpperCase();
}


document.addEventListener('DOMContentLoaded', updateInterfaceStatic);