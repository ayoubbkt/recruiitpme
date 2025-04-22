const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuration de SendGrid ou NodeMailer selon l'environnement
if (process.env.NODE_ENV === 'production') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// En développement, utiliser Nodemailer avec Ethereal pour les tests
let testAccount;
let transporter;

const initializeTransporter = async () => {
  if (process.env.NODE_ENV !== 'production') {
    // Créer un compte de test avec Ethereal
    try {
      testAccount = await nodemailer.createTestAccount();
      
      // Créer un transporteur réutilisable
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      logger.info('Compte de test Ethereal créé:', testAccount.user);
    } catch (error) {
      logger.error('Erreur lors de la création du compte Ethereal:', error);
    }
  }
};

// Initialiser le transporteur au démarrage
initializeTransporter();

/**
 * Envoie un email
 * @param {String} to - Adresse email du destinataire
 * @param {String} subject - Sujet de l'email
 * @param {String} html - Contenu HTML de l'email
 * @param {String} text - Version texte de l'email (facultatif)
 * @returns {Promise} - Résultat de l'envoi
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    const msg = {
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Supprimer les balises HTML si text n'est pas fourni
    };

    let result;

    if (process.env.NODE_ENV === 'production') {
      // Utiliser SendGrid en production
      result = await sgMail.send(msg);
      logger.info(`Email envoyé à ${to}`);
    } else {
      // Utiliser Ethereal en développement
      result = await transporter.sendMail(msg);
      logger.info(`Email de test envoyé à ${to}`);
      logger.info(`URL de prévisualisation: ${nodemailer.getTestMessageUrl(result)}`);
    }

    return { success: true, result };
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

/**
 * Envoie un email de bienvenue après inscription
 * @param {Object} user - Données de l'utilisateur
 * @param {String} token - Token de vérification
 */
const sendWelcomeEmail = async (user, token) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bienvenue sur RecrutPME !</h2>
      <p>Bonjour ${user.firstName},</p>
      <p>Merci de vous être inscrit sur RecrutPME. Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
      <p><a href="${verificationLink}" style="background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirmer mon email</a></p>
      <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe RecrutPME</p>
    </div>
  `;
  
  return sendEmail(user.email, 'Bienvenue sur RecrutPME - Confirmez votre email', html);
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {Object} user - Données de l'utilisateur
 * @param {String} token - Token de réinitialisation
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${user.firstName},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
      <p><a href="${resetLink}" style="background-color: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé à réinitialiser votre mot de passe, vous pouvez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe RecrutPME</p>
    </div>
  `;
  
  return sendEmail(user.email, 'RecrutPME - Réinitialisation de votre mot de passe', html);
};

/**
 * Envoie une invitation d'entretien au candidat
 * @param {Object} candidate - Données du candidat
 * @param {Object} interview - Données de l'entretien
 * @param {Object} job - Données de l'offre d'emploi
 */
const sendInterviewInvitation = async (candidate, interview, job) => {
  const interviewDate = new Date(interview.date);
  const formattedDate = interviewDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invitation à un entretien pour le poste de ${job.title}</h2>
      <p>Bonjour ${candidate.name.split(' ')[0]},</p>
      <p>Nous sommes heureux de vous inviter à un entretien pour le poste de <strong>${job.title}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date :</strong> ${formattedDate}</p>
        <p><strong>Heure :</strong> ${interview.time}</p>
        <p><strong>Interlocuteur :</strong> ${interview.interviewer}</p>
        ${interview.videoLink ? `<p><strong>Lien visioconférence :</strong> <a href="${interview.videoLink}">${interview.videoLink}</a></p>` : ''}
      </div>
      <p>N'hésitez pas à nous contacter si vous avez des questions ou si vous ne pouvez pas vous rendre disponible à cette date.</p>
      <p>Cordialement,<br>${interview.interviewer}<br>${job.location}</p>
    </div>
  `;
  
  return sendEmail(candidate.email, `Invitation à un entretien - ${job.title}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInterviewInvitation
};