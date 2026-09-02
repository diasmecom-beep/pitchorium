export type UserRole = 'entrepreneur' | 'contributeur';

export type Profile = {
  id: string;
  role: UserRole;
  onboarding_completed: boolean;

  // Commun aux deux rôles
  full_name: string;
  headline: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  avatar_url: string | null;
  website: string | null;
  organization: string | null;
  organization_type: string | null;
  created_at: string;

  // Entrepreneur — profil d'entreprise
  company_name: string | null;
  sector: string | null;
  stage: string | null;
  founding_year: number | null;
  team_size: string | null;
  pitch_short: string | null;

  // Entrepreneur — ce qu'il recherche
  needs: string[];
  expertise_needed: string[];
  funding_amount_sought: number | null;
  funding_types_sought: string[];

  // Contributeur — rôle(s) choisis et zone d'intervention
  contribution_types: string[];
  sectors_of_interest: string[];
  intervention_countries: string[];
  expertise_domains: string[];

  // Contributeur — investisseur
  investment_ticket_min: number | null;
  investment_ticket_max: number | null;
  investment_stages: string[];
  investment_instruments: string[];

  // Contributeur — mécène
  mecenat_types: string[];

  // Contributeur — mentor / expert
  mentor_availability: string | null;
  mentor_format: string | null;
  expert_mission_types: string[];

  // Critères d'impact / durabilité
  impact_scores: Record<string, number>;
  impact_score: number;
  impact_notes: string | null;

  // Préférences
  email_notifications_enabled: boolean;
  followers_visible: boolean;
  details_private: boolean;
  available_balance: number;
};

export type ProjectStatus = 'draft' | 'published' | 'funded' | 'closed';

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  summary: string;
  description: string;
  sector: string;
  impact_area: string;
  country: string;
  funding_goal: number;
  amount_raised: number;
  status: ProjectStatus;
  cover_image_url: string | null;
  created_at: string;

  // Campagne de financement
  video_url: string | null;
  gallery_urls: string[];
  duration_days: number;
  deadline: string | null;
  platform_fee_percent: number;
  funding_instruments_accepted: string[];

  // Critères d'impact / durabilité
  impact_scores: Record<string, number>;
  impact_score: number;
  impact_notes: string | null;
};

export type ProjectInterest = {
  id: string;
  project_id: string;
  investor_id: string;
  message: string | null;
  created_at: string;
};

export type CampaignTier = {
  id: string;
  project_id: string;
  amount: number;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
};

export type CampaignReward = {
  id: string;
  project_id: string;
  min_amount: number;
  title: string;
  description: string;
  applicable_instruments: string[];
  quantity_available: number | null;
  quantity_claimed: number;
  estimated_delivery: string | null;
  created_at: string;
};

export type PledgeStatus = 'pending' | 'completed' | 'cancelled';

export type Pledge = {
  id: string;
  project_id: string;
  backer_id: string;
  amount: number;
  funding_instrument: string;
  reward_id: string | null;
  payment_method: string;
  status: PledgeStatus;
  commitment_accepted: boolean;
  created_at: string;
};

export type CampaignUpdate = {
  id: string;
  project_id: string;
  title: string;
  body: string;
  created_at: string;
};

export type TimeContribution = {
  id: string;
  contributor_id: string;
  project_id: string | null;
  hours: number;
  description: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type Follow = {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  project_id: string | null;
  body: string;
  image_url: string | null;
  video_url: string | null;
  tagged_profile_id: string | null;
  filter_color: string | null;
  media_urls: string[];
  shared_post_id: string | null;
  created_at: string;
};

export type ReactionKey =
  | 'heart'
  | 'thumbsup'
  | 'thumbsdown'
  | 'fire'
  | 'target'
  | 'rocket'
  | 'handshake'
  | 'sad'
  | 'laugh';

export type PostLike = {
  id: string;
  post_id: string;
  profile_id: string;
  reaction: ReactionKey;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
};

export type CommentReaction = {
  id: string;
  comment_id: string;
  profile_id: string;
  reaction: ReactionKey;
  created_at: string;
};

export type PostShare = {
  id: string;
  post_id: string;
  profile_id: string;
  created_at: string;
};

export type PostSave = {
  id: string;
  post_id: string;
  profile_id: string;
  created_at: string;
};

export type Story = {
  id: string;
  author_id: string;
  image_url: string;
  caption: string | null;
  caption_color: string | null;
  tagged_profile_id: string | null;
  filter_color: string | null;
  media_urls: string[];
  created_at: string;
};

export type ProfileView = {
  id: string;
  viewer_id: string;
  viewed_profile_id: string;
  created_at: string;
};

export type FollowEvent = {
  id: string;
  follower_id: string;
  followee_id: string;
  event: 'follow' | 'unfollow';
  created_at: string;
};

export type NotificationType = 'follow' | 'like' | 'comment' | 'reply' | 'share' | 'new_post' | 'tag' | 'profile_view';

export type AppNotification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
};

export type WalletTransaction = {
  id: string;
  profile_id: string;
  amount: number;
  type: 'topup' | 'pledge' | 'adjustment';
  note: string | null;
  created_at: string;
};
